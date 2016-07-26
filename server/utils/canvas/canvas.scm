
(define-structure
  (canvas (constructor silently-make-canvas (#!optional xmin xmax ymin ymax
                                             frame-width frame-height
                                             frame-x-position frame-y-position
                                             name)))
  (name (string-append "window-" (number->string (get-id))))
  (xmin -1)
  (xmax 1)
  (ymin -1)
  (ymax 1)
  (frame-width 400)
  (frame-height 300)
  (frame-x-position -1)
  (frame-y-position -1))

(define (canvas->json canvas #!optional action value)
  (dict->json `((name ,(canvas-name canvas))
                (type canvas)
                (action ,action)
                (value ,value))))

(define (send-canvas canvas #!optional action value)
  (send-json (canvas->json canvas action value)))

(define (make-canvas . args)
  (define canvas (apply silently-make-canvas args))
  (send-canvas canvas 'create
    `((xmin ,(canvas-xmin canvas)) (xmax ,(canvas-xmax canvas))
      (ymin ,(canvas-ymin canvas)) (ymax ,(canvas-ymax canvas))
      (frame_width ,(canvas-frame-width canvas))
      (frame_height ,(canvas-frame-height canvas))
      (frame_x_position ,(canvas-frame-x-position canvas))
      (frame_y_position ,(canvas-frame-y-position canvas))))
  canvas)

(define (canvas-coordinate-limits canvas)
  (list (canvas-xmin canvas) (canvas-xmax canvas)
        (canvas-ymin canvas) (canvas-ymax canvas)))

(define (canvas-device-coordinate-limits canvas)
  (list (canvas-frame-width canvas) (canvas-frame-height canvas)))

(define (canvas-set-coordinate-limits canvas x-left y-bottom x-right y-top)
  (send-canvas canvas 'set_coordinate_limits
    `((x_left ,x-left)
      (y_bottom ,y-bottom)
      (x_right ,x-right)
      (y_top ,y-top))))

(define (canvas-clear canvas)
  (send-canvas canvas 'clear))

(define (canvas-draw-point canvas x y)
  (send-canvas canvas 'draw_point `((x ,x) (y ,y))))

(define (canvas-draw-points canvas points)
  (send-canvas canvas 'draw_points `((points ,points))))

(define (canvas-erase-point canvas x y)
  (send-canvas canvas 'erase_point `((x ,x) (y ,y))))

(define (canvas-draw-line canvas x-start y-start x-end y-end)
  (send-canvas canvas 'draw_line
    `((x_start ,x-start)
      (y_start ,y-start)
      (x_end ,x-end)
      (y_end ,y-end))))

(define (canvas-draw-text canvas x y string)
  (send-canvas canvas 'draw_text
    `((x ,x) (y ,y) (string ,string))))

(define (canvas-set-font canvas font-name)
  (send-canvas canvas 'set_font `((font_name ,font-name))))

(define (canvas-resize canvas width height)
  (set-canvas-width! canvas width)
  (set-canvas-height! canvas height)
  (send-canvas canvas 'resize `((width ,width) (height ,height))))

(define (canvas-rename canvas name)
  (send-canvas canvas 'rename `((name ,name)))
  (set-canvas-name! canvas name))
