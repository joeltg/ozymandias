(define (bfgs f g x est ftol maxiter #!transform)
  (let ((n (vector-length x)))
    (if (null? g)
        (set! g (generate-gradient-procedure f n (* 1000 *machine-epsilon*))))
    (let loop ((h (m:make-identity n)) (x x) (fx (f x)) (gx (g x)) (count 0))
      (if bfgs-wallp?
          (print (cons x (cons fx (cons gx '())))))
      (let ((v (matrix*vector h (scalar*vector -1 gx))))
        (if (positive? (v:dot-product v gx))
            (begin
             (if bfgs-wallp?
                 (display (cons "H reset to Identity at iteration" (cons count '()))))
             (loop (m:make-identity n) x fx gx count))
            (let ((r (line-min-davidon f g x v est transform)))
              (if (eq? (car r) 'no-min)
                  (cons 'no-min (cons (cons x fx) (cons count '())))
                  (let ((newx (general-car-cdr r 6)) (newfx (general-car-cdr r 12)))
                    (cond ((close-enuf? newfx fx ftol)
                           (cons 'ok (cons (cons newx newfx) (cons count '()))))
                          ((equal-fixnum? count maxiter)
                           (cons 'maxcount (cons (cons newx newfx) (cons count '()))))
                          (else
                           (let ((newgx (g newx)))
                             (let ((dx (vector-vector newx x)))
                               (let ((dg (vector-vector newgx gx)))
                                 (let ((hdg (matrix*vector h dg)))
                                   (let ((dxdg (v:dot-product dx dg)))
                                     (let ((dghdg (v:dot-product dg hdg)))
                                       (let ((u
                                              (vector-vector (scalar*vector (/ 1 dxdg) dx)
                                                             (scalar*vector (/ 1 dghdg) hdg))))
                                         (let ((a
                                                (matrix*scalar
                                                 (m:outer-product (vector->column-matrix dx)
                                                                  (vector->row-matrix dx))
                                                 (/ 1 dxdg))))
                                           (let ((b
                                                  (matrix*scalar
                                                   (m:outer-product (vector->column-matrix hdg)
                                                                    (vector->row-matrix hdg))
                                                   (/ -1 dghdg))))
                                             (let ((c
                                                    (matrix*scalar
                                                     (m:outer-product (vector->column-matrix u)
                                                                      (vector->row-matrix u))
                                                     dghdg)))
                                               (let ((newh
                                                      (matrix+matrix (matrix+matrix h a)
                                                                     (matrix+matrix b c))))
                                                 (loop newh
                                                       newx
                                                       newfx
                                                       newgx
                                                       (plus-fixnum count 1)))))))))))))))))))))))


(define (line-min-davidon f g x v est #!transform)
  (define (t->x t)
    (vector+vector x (scalar*vector t v)))
  (define (linef t)
    (f (t->x t)))
  (define (lineg t)
    (g (t->x t)))
  (define f0
    (linef 0))
  (define g0
    (lineg 0))
  (define s0
    (/ (- f0 est) -.5 (v:dot-product g0 v)))
  (let loop ((t (if (and (positive? s0) (&< s0 1)) s0 1)) (iter 0))
    (if (&> iter 100)
        (cons 'no-min '())
        (let ((ft (linef t)) (gt (lineg t)))
          (if (or (not (&< ft f0))
                  (not (negative? (v:dot-product v gt))))
              (let ((vg0 (v:dot-product v g0)))
                (let ((vgt (v:dot-product v gt)))
                  (let ((z (+ (* 3 (- f0 ft) (/ 1 t)) vg0 vgt)))
                    (let ((w (sqrt (- (* z z) (* vg0 vgt)))))
                      (let ((tstar (* t (- 1 (/ (+ vgt w (- z)) (+ vgt (- vg0) (* 2 w)))))))
                        (let ((fstar (linef tstar)))
                          (if (&< fstar f0)
                              (cons 'ok (cons (t->x tstar) (cons fstar '())))
                              (loop tstar (+ iter 1)))))))))
              (loop (* t 2) (+ iter 1)))))))
