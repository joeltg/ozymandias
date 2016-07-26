(define initial-env-value 0)
(define default-environment (the-environment))
(define windows '())

(define-structure (window (constructor silently-make-window (#!optional name)))
  (name (string-append "window-" (number->string (get-id))) read-only #t)
  (points '())
  (env '()))

(define (make-window #!optional name)
  (define window (silently-make-window name))
  (send-window window #t)
  (set! windows (cons (list (window-name window) window) windows))
  window)

(define (window-add-to-env window symbols)
  (assert (window? window))
  (set-window-env! window
    (let ((env (window-env window)))
      (append env
        (map (lambda (symbol) (list symbol initial-env-value))
          (list-transform-negative (delete-duplicates symbols)
            (lambda (symbol) (assq symbol env))))))))

(define (window-push-env window env #!optional push)
  (set-window-env! window env)
  (if push (send-window window)))

(define (window-update-env window key val #!optional push)
  (let ((binding (assq key (window-env window))))
    (if binding (set-car! (cdr binding) val))
    (if push (send-window window))))

(define (update-env name key val)
  (let ((window (assoc name windows)))
    (if window
      (window-update-env (cadr window) key val)
      #f)))

(define (make-minimizer keys x y X Y)
  (lambda (vals)
    (let ((env (map list keys (vector->list vals))))
      (+ (square (- x (eval-expr env X)))
         (square (- y (eval-expr env Y)))))))

(define (window-update-point window point x y)
  (let ((env (window-env window))
        (X (point-x point))
        (Y (point-y point)))
    (let ((keys (map car env))
          (vals (list->vector (map cadr env))))
      (let ((minimizer (make-minimizer keys x y X Y)))
        (let ((result (nelder-mead minimizer vals 0.001 0.0001 1000)))
          (if (eq? 'ok (car result))
            (window-push-env window
              (map list keys (vector->list (caadr result))))))))))

(define (update-point window-name point-id x y)
  (let ((window (assoc window-name windows)))
    (if window
      (let ((point (window-point (cadr window) point-id)))
        (if point
          (window-update-point (cadr window) point x y)
          #f))
      #f)))

(define (window-point window id)
  (let ((point (assq id (window-points window))))
    (if point
      (cadr point)
      #f)))

(define (eval-window window)
  (assert (window? window))
  `((type svg)
    (name ,(window-name window))
    (points ,(map eval-point (map cadr (window-points window))))
    (env ,(window-env window))))

(define (window->json window)
  (assert (window? window))
  (dict->json (eval-window window)))

(define (send-window window #!optional push)
  (assert (window? window))
  (send-json (window->json window) push))
