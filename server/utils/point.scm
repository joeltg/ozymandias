(define-structure
  (point (constructor silently-make-point (window #!optional x y)))
  (window '() read-only #t)
  (id (get-id) read-only #t)
  (x 0)
  (y 0)
  (radius 3)
  (color "black")
  (animation '()))

(define (make-point window #!optional x y push)
  (define point (silently-make-point window x y))
  (window-add-point! window point)
  (if push (update window))
  point)

(define (point-move! point x y #!optional push)
  (set-point-x! point x)
  (set-point-y! point y)
  (if push (update (point-window point))))

(define (point-evaluate point variables)
  `((id ,(point-id point))
    (x ,(evaluate-expr (point-x point) variables))
    (y ,(evaluate-expr (point-y point) variables))
    (path ,(point-animation point))
    (radius ,(evaluate-expr (point-radius point) variables))))

(define (point->json point)
  (dict->json `((id ,(point-id point))
                (x ,(point-x point))
                (y ,(point-y point))
                (path ,(point-animation point))
                (radius ,(point-radius point))
                (color ,(point-color point)))))

;; translate is one of 'along or 'over
;; loop is #t or #f
;; duration is in milliseconds
(define (point-animate! point path #!optional duration translate push)
  (set-point-animation! point `((id ,(path-id path))
                                (duration ,duration)
                                (translate ,translate)))
  (if push (update (point-window point))))

(defhandler json point->json point?)
