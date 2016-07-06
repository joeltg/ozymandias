
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


;; Legacy compatibility
(define (frame . args)
  (make-window))
(define (plot-function win f start stop step)
  (make-path win (plot f start stop step))
  #t)
(define (plot-point win x y)
  (make-point win x y)
  #t)
(define (plot-parametric win f start stop step)
  (make-path win (parametrize f start stop step))
  #t)
(define (plot-line win x0 y0 x1 y1)
  (make-path win `((,x0 ,y0) (,x1 ,y1))) #t)
(define get-pointer-coordinates set-window-click-handler!)
