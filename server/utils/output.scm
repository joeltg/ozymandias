(define arguments (command-line))
(define output-path (if (pair? arguments) (car arguments) "log"))
(define output-port (open-output-file output-path))
(define id-counter 0)

(define delimiter "\n")

(define (get-id)
  (set! id-counter (+ id-counter 1))
  id-counter)

(define (send data #!optional push)
  (write-string data output-port)
  (write-string delimiter output-port)
  (if push (flush-output output-port)))
