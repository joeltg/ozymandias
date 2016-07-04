(define-structure
  (path (constructor silently-make-path (window #!optional points)))
  (window '() read-only #t)
  (id (get-id) read-only #t)
  (points '())
  (width "2px")
  (color "black")
  (fill "none"))

(define (make-path window #!optional points push)
  (define path (silently-make-path window points))
  (window-add-path! window path)
  (if push (update window))
  path)

(define (path-append! path x y #!optional push)
  (set-path-points! path (cons point (path-points path)))
  (if push (update (path-window path))))

(define (path-map! path f #!optional push)
  (set-path-points! path (map f (path-points path)))
  (if push (update (path-window path))))

(define (path->json path)
  (dict->json `((id ,(path-id path))
                (points ,(path-points path))
                (width ,(path-width path))
                (color ,(path-color path))
                (fill ,(path-fill path)))))

(defhandler json path->json path?)
