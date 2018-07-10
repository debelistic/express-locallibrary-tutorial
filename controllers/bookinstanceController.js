var Book = require('../models/book');
var BookInstance = require('../models/bookinstance');
var async = require('async');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody} = require('express-validator/filter');

//display list of all bookinstances.
exports.bookinstance_list = function (req, res, next) {

	BookInstance.find()
    .populate('book')
    .exec(function (err, list_bookinstances) {
      if (err) { return next(err); }
      // Successful, so render
      res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });
    
};

//display detail page for a specific bookinstance
exports.bookinstance_detail = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      if (bookinstance==null) { // No results.
          var err = new Error('Book copy not found');
          err.status = 404;
          return next(err);
        }
      // Successful, so render.
      res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    })

};
//display bookinstance create form on GET
exports.bookinstance_create_get = function (req, res) {

  Book.find({}, 'title')
  .exec(function (err, books) {
    if(err){return next(err);}
    //succesful, so render.
    res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
  });	
};

//handle bookinstance on POST
exports.bookinstance_create_post = [
  
  //validate fields.
  body('book', 'Book must be specified').isLength({min:1}).trim(),
  body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
  body('due_back', 'Invalid date').optional({checkFalsy: true}).isISO8601(),

  //sanitize fields
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  //process request after validation and sanitation
  (req, res, next) => {

    //extract the validation from a request.
    const errors = validationResult(req);

    //create a BookInstance object with escaped and trimmed data.
    var bookinstance = new BookInstance(
    {
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back
    });

    if(!errors.isEmpty()){
      //there errors, render form again with sanitized values and error messages.
      Book.find({}, 'title')
      .exec(function (err, books) {
        if(err) {return next(err);}
        //successful, so render.
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books, selected_book: bookinstance.book._id, errors: errors.array(), bookinstance: bookinstance });
      });
      return;
    }
    else {
      //data from form is valid
      bookinstance.save(function (err) {
        if (err){return next(err);}
        //successful - redirect to new record.
        res.redirect(bookinstance.url);
      })
    }
  }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {

    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
        if (err) { return next(err); }
        if (bookinstance==null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render.
        res.render('bookinstance_delete', { title: 'Delete BookInstance', bookinstance:  bookinstance});
    })

};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    
    // Assume valid BookInstance id in field.
    BookInstance.findByIdAndRemove(req.body.id, function deleteBookInstance(err) {
        if (err) { return next(err); }
        // Success, so redirect to list of BookInstance items.
        res.redirect('/catalog/bookinstances');
        });

};

//display bookinstance update on GET
exports.bookinstance_update_get = function (req, res, next) {
	
  async.parallel({
    bookinstance: function (callback) {
      BookInstance.findById(req.params.id).populate('book').exec(callback);
    },
    books: function (callback) {
      Book.find(callback)
    }
  }, function (err, results) {
    if(err){return next(err);}
    if(results.bookinstance==null){
      var err = new Error('Book copy not found');
      err.status = 404;
      return next(err);
    }

    res.render('bookinstance_form', { title: 'Update  BookInstance', book_list : results.books, selected_book : results.bookinstance.book._id, bookinstance:results.bookinstance });
  })
};

//handle bookinstance update on POST
exports.bookinstance_update_post = [
	
  //validate fields.
  body('book', 'Book must be specified').isLength({min:1}).trim(),
  body('imprint', 'Imprint must be specified').isLength({min:1}).trim(),
  body('due_back', 'Invalid date').optional({checkFalsy:true}).isISO8601(),

  //sanitize fields
  sanitizeBody('book').trim().escape(),
  sanitizeBody('imprint').trim().escape(),
  sanitizeBody('status').trim().escape(),
  sanitizeBody('due_back').toDate(),

  //process request after validation and sanitization
  (req, res, next) => {

    //extract the validation errors
    const errors = validationResult(req);

    //create a bookinstance object with escaped/trimmed data and current id
    var bookinstance = new BookInstance(
    {
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id
    });

    if(!errors.isEmpty()){
      // There are errors so render the form again, passing sanitized values and errors.
      Book.find({}, 'title')
      .exec(function (err, books) {
        if(err){return next(err);}
        res.render('bookinstance_form', { title: 'Update BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
      });
      return;
    }
    else{
      BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err, thebookinstance) {
        if(err){return next(err);}

        res.redirect(thebookinstance.url)
      })
    }
  }
];