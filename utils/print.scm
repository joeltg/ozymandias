(define simplifiable?
  (reduce disjunction identity (list symbol? list? vector? procedure?)))

(define (get-latex object)
  (ignore-errors
    (lambda ()
    (expression->tex-string object))))

(define (print-undefined)
  (send 0 "\"#| No return value |#\""))

(define (print-string string)
  (send 0 (string->json string)))

(define (print-unsimplifiable object environment)
  (let ((string (open-output-string)))
    (write-string "#| " string)
    (write object string environment)
    (write-string " |#" string)
    (print-string (get-output-string string))))

(define (print-complex val)
  (let ((string (open-output-string))
        (latex (get-latex val)))
    (write-string "#|\n" string)
    (pp val string)
    (write-string "|#" string)
    (if (string? latex)
      (send 0 (string->json (get-output-string string)) (string->json latex))
      (print-string (get-output-string string)))))

(define (print-record object environment)
  (let ((name (record-type-name (record-type-descriptor object)))
        (description (record-description object)))
    (let ((val `(*record* ,name ,@description)))
      (print-simplifiable val environment))))

(define (print-simplifiable object environment)
  (prepare-for-printing object simplify)
  (let ((val (*last-expression-printed*)))
    (if ((disjunction symbol? number?) val)
      (print-unsimplifiable val environment)
      (print-complex val))))

(define (repl-write object s-expression environment repl)
  (cond
    ((eq? silence object))
    ((undefined-value? object)
      (print-undefined))
    ((unsimplifiable? object)
      (print-unsimplifiable object environment))
    ((simplifiable? object)
      (print-simplifiable object environment))
    ((record? object)
      (print-record object environment))
    (else (print-unsimplifiable object environment))))

(set! hook/repl-write repl-write)
