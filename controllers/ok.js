async companyProfileReviews(req, res, next) {
    let company = await User.findById(req.params.id);
    let user = await req.user;
    let lists;
    if (user) {
        lists = await List.find().where("owner.id").equals(user._id).exec();
    }
    let review;
    let fiveReview = [];
    let fourReview = [];
    let threeReview = [];
    let twoReview = [];
    let oneReview = [];
    let average;

    async function others(page) {
        await review.forEach(function (review) {
            if (review.rating === 5) {
                fiveReview.push(review)
            }
            if (review.rating === 4) {
                fourReview.push(review)
            }
            if (review.rating === 3) {
                threeReview.push(review)
            }
            if (review.rating === 2) {
                twoReview.push(review)
            }
            if (review.rating === 1) {
                oneReview.push(review)
            }
        });
        function calculateAverage(reviews) {
            if (review.length === 0) {
                return 0;
            }
            var sum = 0;
            review.forEach(function (element) {
                sum += element.rating;
            });
            return sum / review.length;
        }
        average = calculateAverage(review).toFixed(1);
        company.averageReview = average.toString();
        await company.save();
        res.render(page,
            {
                title: 'Company Profile',
                review,
                company,
                average,
                fiveReview,
                fourReview,
                threeReview,
                twoReview,
                oneReview,
                lists
            });
    }

    if (req.body.filter === 'recent') {

        review = await Review.find().where("owner.id").equals(company._id).sort({ 'createdAt': -1 }).exec();
        others('show-pages/reviews');

    } else if (req.body.filter === 'positive') {

        review = await Review.find({ rating: { $gte: 4 } }).where("owner.id").equals(user._id).exec();
        others('show-pages/reviews');

    } else if (req.body.filter === 'neutral') {

        review = await Review.find({ rating: { $in: 3 } }).where("owner.id").equals(user._id).exec();
        others('show-pages/reviews');

    } else if (req.body.filter === 'negative') {

        review = await Review.find({ rating: { $gte: 0, $lte: 3.9 } }).where("owner.id").equals(user._id).exec();
        others('show-pages/reviews');

    } else {

        review = await Review.find().where("owner.id").equals(company._id).sort({ 'createdAt': -1 }).exec();
        others('show-pages/reviews');

    }
},