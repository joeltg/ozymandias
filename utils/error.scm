(define (restart->json restart)
  (let ((report (open-output-string)))
    (write-restart-report restart report)
    (list (restart/name restart) (get-output-string report))))

(define (restarts->json restarts)
  (array->json (map restart->json restarts)))

(define (condition-handler condition)
  (define restarts (condition/restarts condition))
  (define report (condition/report-string condition))
  (send 1 (string->json report) (restarts->json restarts))
  (let ((invocation (prompt-for-command-expression "" stdio)))
    (if (eq? invocation 'debug)
      (debug)
      (apply invoke-restart
        (list-ref restarts (car invocation))
        (map
          (lambda (expression)
            (bind-condition-handler
              '()
              condition-handler
              (lambda ()
                (eval expression *the-environment*))))
          (cdr invocation))))))

(bind-default-condition-handler '() condition-handler)
