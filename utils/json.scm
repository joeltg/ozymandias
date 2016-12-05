;;;; json.scm

;; scheme      json
;; ----------------------
;; symbol     ->  string    'foo   -> "\"foo\""
;; string     ->  string    "bar"  -> "\"bar\""
;; number     ->  number    .1337  -> "0.1337"
;; boolean    ->  boolean   #t     -> "true"
;; list       ->  array     '(1 2) -> "[1 2]"
;; null       ->  null      '()    -> "null"
;; default    ->  null      #!default    -> "null"
;; unspecific ->  null      #!unspecific -> "null"
;; alist      ->  object    '((foo 0) (bar 42)) -> "{\"foo\": 0, \"bar\": 42}"
;; ----------------------

;; Set a max. length for decimal numbers. Comment out if you don't care.
(define digit-cutoff 5)
(set! flonum-unparser-cutoff `(relative ,digit-cutoff))

;; Scheme is loose with its many number types, especially their string representations.
;; JSON is very strict. number->json might produce invalid JSON for some edge cases.
;; Deal with it, or make it better.

(define (number->json number)
  (apply string-append (number->json-list number)))

(define (number->json-list number)
  (if (and (exact? number) (integer? number))
    (list (number->string number))
    (let* ((string (number->string (exact->inexact number)))
           (length-of-string (string-length string)))
      (cond ((string=? "." (substring string 0 1))
              (list "0" string))
            ((and (> length-of-string 2) (string=? "-." (substring string 0 2)))
              (list "-0." (substring string 2 length-of-string)))
            ((string=? "." (substring string (- length-of-string 1) length-of-string))
              (list string "0"))
            (else (list string))))))

(define (escape-char char)
  (cond ((char=? char #\\) "\\\\")
         ((char=? char #\") "\\\"")
         ((char=? char delimiter) "\\n")
         (else (char->string char))))

(define (string->json string)
  (apply string-append (string->json-list string)))

(define (string->json-list string)
  `("\"" ,@(map escape-char (string->list string)) "\""))

(define (symbol->json symbol)
  (apply string-append (symbol->json-list symbol)))

(define (symbol->json-list symbol)
  (string->json-list (symbol->string symbol)))

(define (boolean->json boolean)
  (apply string-append (boolean->json-list booleaN)))

(define (boolean->json-list boolean)
  (list (if boolean "true" "false")))

(define (null->json null)
  (apply string-append (null->json-list null)))

(define (null->json-list null)
  (list "null"))

(define (map-json f series)
  (if (= 0 (length series))
    '()
    (append
      (f (car series))
      (append-map (lambda (elem) (cons "," (f elem))) (cdr series)))))

(define (array->json array)
  (apply string-append (array->json-list array)))

(define (array->json-list array)
  `("[" ,@(map-json json-list array) "]"))

(define (vector->json v)
  (array->json (vector->list v)))

(define (vector->json-list v)
  (array->json-list (vector->list v)))

(define (pair->json-list pair)
  `(,@(json-list (car pair)) ":" ,@(json-list (cadr pair))))

(define (dict->json alist)
  (apply string-append (dict->json-list alist)))

(define (dict->json-list alist)
  `("{" ,@(map-json pair->json-list alist) "}"))

(define (array? array)
  (and (list? array) (not (dict? array)) (> (length array) 0)))

(define (dict? dict)
  (and
    (list? dict)
    (> (length dict) 0)
    (every
      (lambda (elem)
        (and
          (list? elem)
          (= 2 (length elem))
          (or
            (symbol? (car elem))
            (string? (car elem)))))
      dict)))

(define (json-error object)
  (error "invalid json object" object))

(define (json-list object)
  (cond
    ((eq? #!unspecific object) (null->json-list object))
    ((default-object? object) (null->json-list object))
    ((boolean? object) (boolean->json-list object))
    ((symbol? object) (symbol->json-list object))
    ((string? object) (string->json-list object))
    ((number? object) (number->json-list object))
    ((null? object) (null->json-list object))
    ((dict? object) (dict->json-list object))
    ((array? object) (array->json-list object))
    ((vector? object) (vector->json-list object))
    (else (json-error object))))

(define (json object)
  (apply string-append (json-list object)))
