(define arguments (command-line))
(assert (pair? arguments))
(define id (car arguments))

(define data-path (string-append "/pipes/data." id))
(define data-port (open-i/o-file data-path))

(define eval-path (string-append "/pipes/eval." id))
(define eval-port (open-i/o-file eval-path))

(define id-counter 0)
(define delimiter #\newline)

(define delimiter-char-set (char-set delimiter))

(define (get-id)
  (set! id-counter (+ id-counter 1))
  id-counter)

(define (send-json data)
  (write-string data data-port)
  (write-char delimiter data-port)
  (flush-output data-port))
