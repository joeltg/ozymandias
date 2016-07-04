(define-structure
  (window (constructor silently-make-window (#!optional name)))
  (name (string-append "window-" (number->string (get-id))) read-only #t)
  (points '())
  (paths '()))

(define (make-window #!optional name push)
  (define window (silently-make-window name))
  (if push (update window))
  window)

(define (window-add-point! window point)
  (set-window-points! window (cons point (window-points window))))

(define (window-add-path! window path)
  (set-window-paths! window (cons path (window-paths window))))

(define (window-attach-click-listener! window continuation)
  (defhandler 'click (lambda (name x y) (continuation x y))
    (lambda (name) (string=? name (window-name window)))))

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

(defhandler json window->json window?)
