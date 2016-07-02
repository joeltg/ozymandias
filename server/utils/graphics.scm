
(define (parametrize f start stop step)
  (let iter ((t start) (points '()))
    (if (< t stop)
      (iter (+ t step) (cons (f t) points))
      points)))

(define (plot f start stop step)
  (parametrize (lambda (t) (list t (f t))) start stop step))

(define (circle #!optional radius step)
  (let ((radius (if (default-object? radius) 1 radius))
        (step (if (default-object? step) 0.1 step)))
    (parametrize
      (lambda (theta)
        (list (* radius (sin theta))
              (* radius (cos theta))))
      0 (* 2 pi) step)))
