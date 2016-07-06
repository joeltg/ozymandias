(define (default-click . args) #f)
(define (default-evaluate name vars) #f)
(define env (the-environment))

(define-structure
  (window (constructor silently-make-window (#!optional name)))
  (name (string-append "window-" (number->string (get-id))) read-only #t)
  (click-handler default-click)
  (points '())
  (paths '()))

(define (evaluate-expr expr variables)
  (cond ((number? expr) expr)
        ((symbol? expr) (cadr (assq expr variables)))
        ((list? expr) (eval `(let ,variables ,(simplify expr)) env))))

(define (default-window-evaluate window variables)
  (let ((points (map (lambda (point) (point-evaluate point variables)) (window-points window)))
        (paths (map (lambda (path) (path-evaluate path variables)) (window-paths window))))
    (send (dict->json `((name ,(window-name window))
                        (points ,points)
                        (paths ,paths))))))

(define (make-window #!optional name push)
  (define window (silently-make-window name))
  (defhandler 'window-click
    (lambda (name x y button) ((window-click-handler window) x y button))
    (lambda (name) (string=? name (window-name window))))
  (defhandler 'window-evaluate
    (lambda (name variables) (default-window-evaluate window variables))
    (lambda (name) (string=? name (window-name window))))
  (if push (update window))
  window)

(define (window-add-point! window point)
  (set-window-points! window (cons point (window-points window))))

(define (window-add-path! window path)
  (set-window-paths! window (cons path (window-paths window))))

(define (window->json window #!optional actions)
  (dict->json `((name ,(window-name window))
                (points ,(window-points window))
                (paths ,(window-paths window))
                (actions ,actions))))

(define (update window . actions)
  (send (window->json window actions) #t))

(define (clear-window window)
  (set-window-paths! window '())
  (set-window-points! window '())
  (update window "clear"))
(define (scale-window window) (update window "scale"))
(define (close-window window) (update window "close"))


(define window-evaluate (make-generic-operator 2 'window-evaluate default-evaluate))

(define window-click (make-generic-operator 4 'window-click default-click))
(defhandler json window->json window?)
