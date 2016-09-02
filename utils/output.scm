(define arguments (command-line))
(assert (pair? arguments))
(define pipe-path (car arguments))
(define pipe-port (open-i/o-file pipe-path))
(define id-counter 0)

(define delimiter #\newline)
(define delimiter-char-set (char-set delimiter))

(define (get-id)
  (set! id-counter (+ id-counter 1))
  id-counter)

(define (send-json data #!optional push)
  (write-string data pipe-port)
  (write-char delimiter pipe-port)
  (if push (flush-output pipe-port)))
