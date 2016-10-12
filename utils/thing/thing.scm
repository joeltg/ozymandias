(define default-value 0)
(define things '())
(define maxiter 10)
(define (tolerance output)
  (/ output 100))

(define-structure (thing (constructor silently-make-thing (f g args vals)))
  (id (get-id) read-only #t)
  (f #f read-only #t)
  (g #f read-only #t)
  (args #f read-only #t)
  (vals #f))

(define (get-thing id)
  (let ((match (assq id things)))
    (and match (cdr match))))

(define (make-thing f)
  (let ((args (lambda-args f)) (g (lambda-gradient f)))
    (let ((vals (vector-map (lambda (arg) default-value) args)))
      (let ((thing (silently-make-thing f g args vals)))
        (set! things (cons (cons (thing-id thing) thing) things))
        thing))))

(define (eval-thing thing)
  (assert (thing? thing))
  (apply (thing-f thing) (vector->list (thing-vals thing))))

; fluid-args is a vector of symbols (for free args) or #f (for fixed args)
(define (make-lambda f vals fluid-args)
  fo)

;(define (expr->thing expr)
;  (assert (or (eq? number-type-tag (type expr))
;              (number? expr)
;              (symbol? epxr)))
;  (let ((thing (silently-make-thing
;                 (simplify expr)
;                 (map (lambda (symbol) (list symbol default-value))
;                      (delete-duplicates (extract-symbols expr))))))
;    (set! things (cons (cons (thing-id thing) thing) things))
;    thing))

(define (lambda-args lambda-expression)
  (vector-tail (system-pair-cdr (procedure-lambda lambda-expression)) 1))

(define (lambda-gradient lambda-expression)
  (D lambda-expression))

(define (minimize f g output initial)
  (bfgs f g initial initial (tolerance output) maxiter))

(define (foo-thing thing desired-output)
  (let ((f (thing-f thing))
        (g (thing-g thing))
        (vals (thing-vals thing)))
    (define (minimizer vals)
      (abs (- desired-output (apply f (vector->list vals)))))
    (define (minimizer-gradient vals)
      (let ((args (vector->list vals)))
        (* (sign (- desired-output (apply f args))) (apply g args))))
    (minimize minimizer minimizer-gradient (apply f (vector->list vals)) vals)))

(define (foo-thing thing desired-output free-args fixed-args)
  (let ((f (thing-f thing))
        (g (thing-g thing)))
    ))

(define (extract-symbols expr)
  (cond
    ((number? expr) '())
    ((symbol? expr) (list expr))
    ((eq? number-type-tag (type expr))
      (let iter ((tree (expression expr)))
        (cond
          ((symbol? tree) (list tree))
          ((number? tree) '())
          ((list? tree) (reduce append '() (map iter (cdr tree))))
          (else '()))))))
