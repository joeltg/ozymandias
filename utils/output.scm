(define arguments (command-line))
(assert (pair? arguments))
(define id (car arguments))

(define print-path (string-append "/pipes/print-" id))
(define data-path (string-append "/pipes/data-" id))
(define print-port (open-output-file print-path))
(define data-port (open-i/o-file data-path))
(set-current-output-port! print-port)

(define old-pp pp)
(set! pp
  (lambda args
    (apply old-pp args)
    (flush-output (current-output-port))))

(define id-counter 0)
(define delimiter #\newline)

(define delimiter-char-set (char-set delimiter))

(define (get-id)
  (set! id-counter (+ id-counter 1))
  id-counter)

(define (send-data data)
  (write-string data data-port)
  (write-char delimiter data-port)
  (flush-output data-port))
