(define (stack->json)
  (let ((condition (nearest-repl/condition)))
    (if condition
      (internal-stack->json (condition/continuation condition))
      (call-with-current-continuation internal-stack->json))))

(define (internal-stack->json continuation)
  (let ((frames (map format-frame (continuation->frames continuation))))
    (array->json
      (if (> (length frames) 5)
        (list-head frames (- (length frames) 5))
        frames))))

(define lambda-tag:internal-lambda (string->symbol "#[internal-lambda]"))
(define lambda-tag:internal-lexpr (string->symbol "#[internal-lexpr]"))

(define special-form-procedure-names
  `((,lambda-tag:unnamed . LAMBDA)
    (,lambda-tag:internal-lambda . LAMBDA)
    (,lambda-tag:internal-lexpr . LAMBDA)
    (,lambda-tag:let . LET)
    (,lambda-tag:fluid-let . FLUID-LET)))

(define (special-form-procedure-name? name)
  (let ((association (assq name special-form-procedure-names)))
    (and association
	 (symbol-name (cdr association)))))

(define (continuation->frames continuation)
  (let loop ((frame (stack-frame/skip-non-subproblems (continuation->stack-frame continuation)))
             (frames '()))
      (if (and frame (not (stack-frame/repl-eval-boundary? frame)))
        (loop (stack-frame/next-subproblem frame) (cons frame frames))
        frames)))

(define (format-frame frame)
  (with-values
    (lambda () (stack-frame/debugging-info frame))
    format-subproblem))

(define (format-name name)
  (cond
    ((string? name) name)
    ((interned-symbol? name) (symbol-name name))
    (else (write-to-string name))))

(define (format-environment environment)
  (let ((name (and (environment? environment) (environment-procedure-name environment))))
    (if (or (not name) (special-form-procedure-name? name))
      #f
      (format-name name))))

(define (format-expression expression)
  (cond
    ((debugging-info/compiled-code? expression) "<compiled code>")
    ((not (debugging-info/undefined-expression? expression))
      (fluid-let ((*unparse-primitives-by-name?* #t))
        (let ((string (open-output-string)))
          (pp expression string)
          (get-output-string string))))
    ((debugging-info/noise? expression)
      (write-to-string ((debugging-info/noise expression) #f)))
    (else "<undefined expression>")))

(define (format-subproblem expression environment subexpression)
  (let ((env (format-environment environment))
        (exp (format-expression expression)))
    `((env ,env) (exp ,exp))))
