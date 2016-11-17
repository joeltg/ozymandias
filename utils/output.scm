(define arguments (command-line))
(assert (pair? arguments))
(define id (car arguments))

(define data-path (string-append "/pipes/data-" id))
(define data-port (open-i/o-file data-path))

(define print-path (string-append "/pipes/print-" id))
(define print-port (open-output-file print-path))

;(define old-output-port (current-output-port))
;(set-current-output-port! print-port)
;(define old-pp pp)
;(set! pp
;  (lambda (object #!optional port . rest)
;    (apply old-pp object port rest)
;    (if (or (default-object? port) (eq? port print-port))
;      (flush-output print-port))))
;(define old-display display)
;(set! display
;  (lambda (object #!optional port environment)
;    (old-display object port environment)
;    (if (or (default-object? port) (eq? port print-port))
;      (flush-output print-port))))

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
