(define (format-restart restart)
  (let ((report (open-output-string)))
    (write-restart-report restart report)
    (list
      (restart/name restart)
      (get-output-string report)
      (procedure-arity-min (procedure-arity (restart/effector restart))))))

(define (restarts->json restarts)
  (array->json (map format-restart restarts)))

(define (condition-handler condition)
  (define restarts (condition/restarts condition))
  (define report (condition/report-string condition))
  (send 1 (string->json report) (restarts->json restarts) (stack->json))
  (let iter ((invocation (prompt-for-command-expression "" stdio)))
    (apply invoke-restart
      (list-ref restarts (car invocation))
      (map
        (lambda (expression)
          (bind-condition-handler
            '()
            condition-handler
            (lambda ()
              (eval expression *the-environment*))))
        (cdr invocation)))))

(bind-default-condition-handler '() condition-handler)
