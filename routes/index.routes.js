const express = require('express');
const router = express.Router();
const { authProvince } = require('../models/Province');
const { authCountry } = require('../models/Country');
const { viewDashboard } = require('../models/Dashboard');
const { findConfreres, findCentres, findScholastics,viewConfre, viewCentre, viewScholastic } = require('../models/Search');
const { findObituary, findAnniversary } = require('../models/Obituary');
const { listConfreFilters, listCentreFilters, listObituaryFilters } = require('../models/Filters');
const { check, validationResult } = require('express-validator');
const authAccessToken = require("../middlewares/authAccessToken");
const axios = require('axios');




router.get("/list-province", authAccessToken, async (req, res) => {
    try {
        const listProvince = await authProvince();

        if (!listProvince || listProvince.length === 0) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: 'NOT_FOUND',
                message: 'The requested province resource could not be found or is empty.',
                results: null
            });
        } else {
            return res.status(200).json({
                status: true,
                statuscode: 200,
                code: 'FETCHED',
                message: "Province list fetched successfully.",
                results: listProvince
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the province list.",
            results: error
        });
    }
});

router.get("/list-country", authAccessToken, async (req, res) => {
    try {
        const listCountry = await authCountry();

        if (!listCountry || listCountry.length === 0) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: 'NOT_FOUND',
                message: 'The requested country resource could not be found or is empty.',
                results: null
            });
        } else {
            return res.status(200).json({
                status: true,
                statuscode: 200,
                code: 'FETCHED',
                message: "Country list fetched successfully.",
                results: listCountry
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "An internal server error occurred while fetching the country list.",
            results: error
        });
    }
});

router.post("/view-dashboard", [
    check('provincecode')
        .not()
        .isEmpty()
        .withMessage('The provincecode is required and should not be empty.')
    ], authAccessToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(422).json({
            status: false,
            statuscode: 422,
            code: "VALIDATION_ERROR",
            message: "The request cannot be processed due to validation errors.",
            results: firstError
        });
    }
    try {
        var provincecode=req.body.provincecode;
        const viewRes = await viewDashboard(provincecode);
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Dashboard deatils fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the data.",
            results: error
        });
    }
});

router.post("/find-confreres", authAccessToken, async (req, res, next) => {
    try {
        const {
            provincecode = 'ALL',
            searchtxt = '',
            memtyp = 'ALL',
            bloodgroup = 'ALL',
            natlty = 'ALL',
            languagecode = 'ALL',
            divtyp = 'ALL',
            subdivision = 'ALL',
            destyp = 'ALL'
        } = req.body;

        console.log("🔍 Request Received for /find-confreres:", req.body);

        // Call findConfreres function
        const viewRes = await findConfreres(provincecode, searchtxt, memtyp, bloodgroup, natlty, languagecode, divtyp, subdivision, destyp);

        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Confreres list fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        console.error("❌ Error in /find-confreres:", error, "🔍 Request Body:", req.body);
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the confreres list.",
            error: error.message || error
        });
    }
});




router.get("/list-confre-filters", authAccessToken, async (req, res) => {
    try {
        var listFilter = await listConfreFilters();

        if (!listFilter || listFilter.length === 0) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: 'NOT_FOUND',
                message: 'The requested filter resource could not be found or is empty.',
                results: null
            });
        } else {
            return res.status(200).json({
                status: true,
                statuscode: 200,
                code: 'FETCHED',
                message: "Filter list fetched successfully.",
                results: listFilter
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "An internal server error occurred while fetching the country list.",
            results: error
        });
    }
});

router.post("/view-confre", [
    check('confrercode')
        .not()
        .isEmpty()
        .withMessage('The confrercode is required and should not be empty.')
    ], authAccessToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(422).json({
            status: false,
            statuscode: 422,
            code: "VALIDATION_ERROR",
            message: "The request cannot be processed due to validation errors.",
            results: firstError
        });
    }
    try {
        var confrercode=req.body.confrercode;
        const viewRes = await viewConfre(confrercode);
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Confrer deatils fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the data.",
            results: error
        });
    }
});



router.post("/view-scholastic", [
    check('scholasticCode')
        .not()
        .isEmpty()
        .withMessage('The scholasticCode is required and should not be empty.')
], authAccessToken, async (req, res) => {
    console.log("Request Body:", req.body); // Debugging step

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: false,
            statuscode: 422,
            code: "VALIDATION_ERROR",
            message: "The request cannot be processed due to validation errors.",
            results: errors.array()[0]
        });
    }

    try {
        const scholasticCode = req.body.scholasticCode;
        
        // Fetch Scholastic Details
        const scholasticDetails = await viewScholastic(scholasticCode);

        if (scholasticDetails.error) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: "NOT_FOUND",
                message: "Scholastic details not found.",
                results: {}
            });
        }

        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Scholastic details fetched successfully.",
            results: scholasticDetails
        });
    } catch (error) {
        console.error("Error in /view-scholastic:", error);
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the data.",
            results: error.message
        });
    }
});





router.post("/find-centres", authAccessToken, async (req, res, next) => {
    var provincecode = req.body.provincecode;
    var searchtxt = req.body.searchtxt;
    var divtyp = req.body.divtyp;
    var apostl = req.body.apostl;
    var ctrtyp = req.body.ctrtyp;
    var diocse = req.body.diocse;
    var communitygroup = req.body.communitygroup;
    var language = req.body.language;
    var state = req.body.state;
    var country = req.body.country;
    try {
        const viewRes = await findCentres(provincecode, searchtxt, divtyp, apostl, ctrtyp, diocse, communitygroup, language, state, country );
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Center list fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the province list.",
            results: error
        });
    }
});

router.get("/list-centre-filters", authAccessToken, async (req, res) => {
    try {
        var listFilter = await listCentreFilters();

        if (!listFilter || listFilter.length === 0) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: 'NOT_FOUND',
                message: 'The requested filter resource could not be found or is empty.',
                results: null
            });
        } else {
            return res.status(200).json({
                status: true,
                statuscode: 200,
                code: 'FETCHED',
                message: "Filter list fetched successfully.",
                results: listFilter
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "An internal server error occurred while fetching the country list.",
            results: error
        });
    }
});

router.post("/view-centre", [
    check('centrecode')
        .not()
        .isEmpty()
        .withMessage('The centrecode is required and should not be empty.')
    ], authAccessToken, async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(422).json({
            status: false,
            statuscode: 422,
            code: "VALIDATION_ERROR",
            message: "The request cannot be processed due to validation errors.",
            results: firstError
        });
    }
    try {
        var centrecode=req.body.centrecode;
        const viewRes = await viewCentre(centrecode);
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Centre deatils fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the data.",
            results: error
        });
    }
});

router.post("/find-obituary", authAccessToken, async (req, res, next) => {
    var provincecode = req.body.provincecode;
    var searchtxt = req.body.searchtxt;
    var memtyp = req.body.memtyp;
    var language = req.body.language;
    var dcountry = req.body.dcountry;
    var ocountry = req.body.ocountry;
    var fromdate = req.body.fromdate;
    var todate = req.body.todate;
    try {
        const viewRes = await findObituary(provincecode, searchtxt, memtyp, language, dcountry, ocountry, fromdate, todate);
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Center list fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching the province list.",
            results: error
        });
    }
});

router.get("/list-obituary-filters", authAccessToken, async (req, res) => {
    try {
        var listFilter = await listObituaryFilters();

        if (!listFilter || listFilter.length === 0) {
            return res.status(404).json({
                status: false,
                statuscode: 404,
                code: 'NOT_FOUND',
                message: 'The requested filter resource could not be found or is empty.',
                results: null
            });
        } else {
            return res.status(200).json({
                status: true,
                statuscode: 200,
                code: 'FETCHED',
                message: "Filter list fetched successfully.",
                results: listFilter
            });
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "An internal server error occurred while fetching the country list.",
            results: error
        });
    }
});

router.post("/find-anniversary", authAccessToken, async (req, res, next) => {
    var deathdate = req.body.deathdate;
    try {
        const viewRes = await findAnniversary(deathdate);
        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Anniversary list fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching.",
            results: error
        });
    }
});

router.post("/find-scholastics", authAccessToken, async (req, res, next) => {
    try {
        const {
            provincecode = 'ALL',
            searchtxt = '',
            natlty = 'ALL'  // Only filtering by nationality code
        } = req.body;

        console.log("🔍 Request Received for /find-scholastics:", req.body);

        // ✅ Call findScholastics with the correct parameters
        const viewRes = await findScholastics(provincecode, searchtxt, natlty);

        return res.status(200).json({
            status: true,
            statuscode: 200,
            code: 'FETCHED',
            message: "Scholastics list fetched successfully.",
            results: viewRes
        });
    } catch (error) {
        console.error("❌ Error in /find-scholastics:", error, "🔍 Request Body:                                                                                                             ", req.body);
        return res.status(500).json({
            status: false,
            statuscode: 500,
            code: 'INTERNAL_SERVER_ERROR',
            message: "Internal Server Error. An error occurred while fetching th                                                                                                             e scholastics list.",
            error: error.message || error
        });
    }
});


router.get('/app-version', async (req, res) => {
    try {
        const appId = '6741805555'; 
        const countryCode = 'IN'; 
        const timestamp = Date.now(); // Generate timestamp
        
        const url = `https://itunes.apple.com/lookup?id=${appId}&country=${countryCode}&t=${timestamp}`;
        
        const response = await axios.get(url);
        const data = response.data;
        
        if (data && data.results.length > 0) {
            const latestVersion = data.results[0].version;
            res.json({ version: latestVersion });
        } else {
            res.status(404).json({ error: 'Failed to fetch app version' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred', details: error.message });
    }
});





module.exports = router;
