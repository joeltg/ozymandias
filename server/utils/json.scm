;; JavaScript is picky about parsing numbers.
;; Valid JSON numbers have to start with a digit (".04" and "-.1" are invalid),
;; and also have to end with a digit ("50." is invalid).

(define (number->json number)
  (define string (number->string (exact->inexact number)))
  (define length-of-string (string-length string))
  (cond ((equal? "." (substring string 0 1))
          (string-append "0" string))
        ((and (> length-of-string 2)
              (equal? "-." (substring string 0 2)))
          (string-append "-0." (substring string 2 length-of-string)))
        ((equal? "." (substring string (- length-of-string 1) length-of-string))
          (string-append string "0"))
        (else string)))

(define (string->json string)
  (string-append "\"" string "\""))

(define (symbol->json symbol)
  (string-append "\"" (symbol->string symbol) "\""))

(define (boolean->json boolean)
  (if boolean "true" "false"))

(define (null->json null)
  "null")

(define (map-json f series)
  (if (= 0 (length series))
    ""
    (string-append
      (f (car series))
      (apply string-append
        (map (lambda (elem) (string-append "," (f elem))) (cdr series))))))

(define (array->json array)
  (string-append "[" (map-json json array) "]"))

(define (pair->json pair)
  (string-append (json (car pair)) ":" (json (cadr pair))))

(define (dict->json alist)
  (string-append "{" (map-json pair->json alist) "}"))

(define (array? array)
  (and (list? array) (not (dict? array)) (> (length array) 0)))

(define (dict? dict)
  (and (list? dict) (> (length dict) 0)
    (every (lambda (elem) (and (list? elem)
                               (= 2 (length elem))
                               (symbol? (car elem))))
      dict)))

(define (json-error object) (error "invalid json object" object))
(define json (make-generic-operator 1 'json json-error))

(defhandler json number->json number?)
(defhandler json string->json string?)
(defhandler json symbol->json symbol?)
(defhandler json boolean->json boolean?)
(defhandler json null->json null?)
(defhandler json null->json default-object?)
(defhandler json array->json array?)
(defhandler json dict->json dict?)
