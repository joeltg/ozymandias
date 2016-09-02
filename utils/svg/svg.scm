
(define (eval-expr env expr)
  (cond
    ((number? expr) expr)
    ((symbol? expr) (cadr (assq expr env)))
    ((eq? number-type-tag (type expr))
      (eval `(let ,env ,expr) default-environment))))

(define (extract-symbols number)
  (cond
    ((number? number) '())
    ((symbol? number) (list number))
    ((eq? number-type-tag (type number))
      (let iter ((tree (expression number)))
        (cond
          ((symbol? tree) (list tree))
          ((number? tree) '())
          ((list? tree) (reduce append '() (map iter (cdr tree)))))))))
