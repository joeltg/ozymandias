(define global-restarts '())
(define (restart->json restart)
  (let ((report (open-output-string)))
    (write-restart-report restart report)
    (list (restart/name restart) (get-output-string report))))

(define (restarts->json restarts)
  (array->json (map restart->json restarts)))

;(define (global-restart index . arguments)
;  (apply invoke-restart (list-ref global-restarts index) arguments))

(define (global-restart index)
  (let ((restart (list-ref global-restarts index)))
    (pp "index")
    (lambda arguments
      (pp "arguments")
      (apply invoke-restart restart arguments))))

(set! standard-error-hook
  (lambda (condition)
    (let ((report (condition/report-string condition))
          (restarts (condition/restarts condition)))
      (send-error report restarts))))

(define (send-error report restarts)
  (set! global-restarts restarts)
  (send-data
    (string-append "[1," (string->json report) "," (restarts->json restarts) "]")))
