
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var Genre = require('../models/genre');

var Book = require('../models/book');
var async = require('async');

//diplay list of all genre
exports.genre_list = function (req, res, next) {
	
	Genre.find()
	.sort([['name', 'ascending']])
	.exec(function (err, list_genres) {
		if(err){return next(err);}
		res.render('genre_list', {title: 'Genre List', genre_list: list_genres})
	})
};

//display detail page for specific genre
exports.genre_detail = function (req, res, next) {
	
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.params.id)
			.exec(callback);
		},

		genre_books: function (callback) {
			Book.find({'genre': req.params.id})
			.exec(callback)
		},

	}, function (err, results) {
		if(err) {return next(err);}
		if(results.genre==null){
			var err = new Error('Genre Not Found');
			err.status = 404;
			return next(err);
		}
		res.render('genre_detail', {title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books});
	});
};

//dispaly genre create form on GET
exports.genre_create_get = function (req, res) {
	res.render('genre_form', {title: 'Create Genre'});
};

//handle genre create on POST
exports.genre_create_post = [
	
	//validate that the name field is not empty
	body('name', 'Genre name required').isLength({ min: 1 }).trim(),

	//sanitize (trim and escape) the name field
	sanitizeBody('name').trim().escape(),

	//process the request after validation and sanitazation
	(req, res, next) => {

		//extract the validation errors from a request
		const errors = validationResult(req);

		//create a genre object with escaped and trimmed data
		var genre = new Genre(
				{name: req.body.name}
			);

		if(!errors.isEmpty()){
			//there are some errors render the form again with sanitizzed values/error messages
			res.render('genre_form', {title: 'Create Genre', genre: genre, errors: errors.array()});
		return;
		}
		else{
			//data form is valid
			//check if genre with same name already exists
			Genre.findOne({'name': req.body.name})
			.exec( function (err, found_genre) {
				if(err){return next(err);}

				if(found_genre){
					//genre exists, redirect to detail page
					res.redirect(found_genre.url);
				}
				else{
					genre.save(function(err){
						if(err){return next(err);}
						//genre saved, redirect ti genre detail page
						res.redirect(genre.url)
					});
				}
			});
		}
	}


];

//display genre delete form on GET
exports.genre_delete_get = function (req, res, next) {
	
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.params.id).exec(callback);
		},
		genres_books: function (callback) {
			Book.find({'genre': req.params.id}).exec(callback)
		},
	}, function (err, results) {
		if(err){return next(err);}
		if(results.genre==null){
			//no results.
			res.redirect('/catalog/genres');
		}
		res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
	})
};

//handle genre delete on POST
exports.genre_delete_post = function (req, res, next) {
	
	async.parallel({
		genre: function (callback) {
			Genre.findById(req.params.id).exec(callback);
		},
		genres_books: function (callback) {
			Book.find({'genre': req.params.id}).exec(callback)
		},
	}, function (err, results) {
		if(err){return next(err);}
		if(results.genre_books.length > 0){
			res.render('genre_delete', {title: 'Delete Genre', genre: results.genre, genre_books: results.genres_books });
		}
		else{
			Genre.findByIdAndRemove(req.body.genreid, function deleteGenre (err) {
				if(err){return next(err);}

				res.redirect('/catalog/genres')
			})
		}
	})
};

//display genre update form on GET
exports.genre_update_get = function (req, res) {
	
	Genre.findById(req.params.id, function (err, genre) {
		if(err){return next(err);}
		if(genre==null){
			var err = new Error('Genre not found');
			err.status =404;
			return next(err);
		}
		res.render('genre_form', { title: 'Update Genre', genre: genre });
	});
};

//handle genre update on POST
exports.genre_update_post = [
	
	//validate that the name field is not empty.
	body('name', 'Genre name required').isLength({min:1}).trim(),

	//sanitize the name field
	sanitizeBody('name').trim().escape(),

	//process request
	(req, res, next) => {

		//extract the validation errors from a request
		const errors = validationResult(req);

		//create a genre object with escaped and trimmed data old id
		var genre = new Genre(
		{
			name: req.body.name,
			_id: req.params.id
		});

		if(!errors.isEmpty()){
			res.render('genre_form', { title: 'Update Genre', genre: genre, errors: errors.array()});
		return;
		}
		else{
			Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
				if(err){return next(err);}
				res.redirect(thegenre.url);
			});
		}
	}
];