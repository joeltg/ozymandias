
(define (restart->json restart)
  (let ((report (open-output-string)))
    (write-restart-report restart report)
    (list (restart/name restart) (get-output-string report))))

(define (restarts->json restarts)
  (array->json (map restart->json restarts)))

(set! standard-error-hook
  (lambda (condition)
    (let ((report (string->json (condition/report-string condition)))
          (restarts (restarts->json (condition/restarts condition))))
      (send-data (string-append "[1," report "," restarts "]")))))
