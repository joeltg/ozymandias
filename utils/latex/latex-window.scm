(define latex-environment (the-environment))

(define-structure (latex-window (constructor silently-make-latex-window (#!optional name)))
  (name (string-append "latex-window-" (number->string (get-id))) read-only #t))

(define (make-latex-window #!optional name latex)
  (define latex-window (silently-make-latex-window name latex))
  (send-latex-window latex-window #t)
  latex-window)

(define (latex-window->json latex-window #!optional latex)
  (assert (latex-window? latex-window))
  (dict->json `((name ,(latex-window-name latex-window))
                (type latex)
                (latex ,(if (default-object? latex) "" latex)))))

(define (render-expression #!optional expression latex-window)
  (if (default-object? expression)
      (if (or (undefined-value? (*last-expression-printed*))
              (and (procedure? (*last-expression-printed*))
                   (not (operator? (*last-expression-printed*)))))
            (*last-expression-printed*)
            (render-expression (*last-expression-printed*) latex-window))
      (let ((latex-window (if (latex-window? latex-window) latex-window (silently-make-latex-window)))
            (expression (cond ((literal-number? expression) (simplify expression))
                               ((literal-function? expression) (simplify expression))
                               (else expression))))
        (send-latex-window latex-window (expression->tex-string expression) #t)
        expression)))

(define re render-expression)

(define last-latex-window #f)

(define (send-latex-window latex-window #!optional latex push)
  (assert (latex-window? latex-window))
  (set! last-latex-window latex-window)
  (send-json (latex-window->json latex-window latex) push))
