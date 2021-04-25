'use strict';

////////////////////////
////// Dependencies ///
//////////////////////

//DOTENV
require('dotenv').config();

//EXPRESS
const express= require('express');

//CORS
const cors= require('cors');

//superagent
const superagent= require('superagent');

//PG
const pg= require('pg');

// method-override
const methodOverride= require('method-override');




////////////////////////
////// APP setup    ///
//////////////////////

//PORT
const PORT= process.env.PORT;

// run express
const app=express();

// use cors
app.use(cors());

//middleware
app.use(express.urlencoded({ extended: true }));


////PG
//1
const client = new pg.Client(process.env.DATABASE_URL);
//2
// const client = new pg.Client({connectionString:process.env.DATABASE_URL, ssl:{rejectUnauthorized:false}});

//methodOverride
app.use(methodOverride('_method'));

////////////////////////
////// templating   ///
//////////////////////

//Public
app.use(express.static('./public'));

//EJS
app.set('view engine', 'ejs');

////////////////////////
////// Routes       ///
//////////////////////

app.get('/', homeHandler);

app.get('/searchCorona', searchHandler);

app.get('/allCountries', allCountriesHandler);

app.post('/saveData', addDataHandler);

app.get('/saveData', renderSavedData);

app.get('/alreadySaved', alreadySavedHandler);

app.get('/details/:id', singleDataHandler);

app.put('/details/:id', updateHandler);

app.delete('/details/:id',deleteHandler);








////////////////////////
////// Handlers     ///
//////////////////////

//HOME
function homeHandler(req,res){
    let url= 'https://api.covid19api.com/world/total';

    superagent.get(url).then(data=>{
        let dataBody= data.body;
        res.render('pages/index', {data:dataBody})
    })

}


//Search for specific country

function searchHandler(req,res){
    let search_query= req.query.search_query;
    let from=req.query.from;
    let to= req.query.to;
    console.log(req.query)
    let url = `https://api.covid19api.com/country/${search_query}/status/confirmed?from=${from}&to=${to}`;
    console.log(req.query)
    superagent.get(url).then(data=>{
        let dataBody=data.body;
        let correctData= dataBody.map(e=>{
            return new Country(e);
        });

        res.render('pages/searched', {data:correctData})

    }).catch(err=>{
        res.send(err)
    })

}



// All Countries

function allCountriesHandler(req,res){
    let url='https://api.covid19api.com/summary';

    superagent.get(url).then(data=>{
        let dataBody= data.body;
        let correctData= dataBody.Countries.map(e=>{
            return new Countries(e);
        });
        res.render('pages/allCountries', {data:correctData});

    }).catch(err=>{
        res.send(err)
    });
}




// addDataHandler

function addDataHandler(req,res){
    const {country,confirmed,recovered,deaths,date}=req.body;
    const safeValues= [country,confirmed,recovered,deaths,date];

    const SQL=`INSERT INTO table1 (country,confirmed,recovered,deaths,date) VALUES ($1,$2,$3,$4,$5)`;

    const searchSql= `SELECT * FROM table1 WHERE country= '${country}';`;

    client.query(searchSql).then(searchedData=>{
        if(searchedData.rows.length===0){
            client.query(SQL,safeValues).then(()=>{
                res.redirect('/saveData')
            });
        }else if(searchedData.rows[0].country===country){
            res.redirect('/alreadySaved');
        }
    }).catch(err=>{
        res.send(err)
    });
}

function renderSavedData(req,res){
    const SQL= 'SELECT * FROM table1;';
    client.query(SQL).then(data=>{
        res.render('pages/savedData',{data:data.rows})
    }).catch(err=>{
        res.send(err);
    });
}

function alreadySavedHandler(req,res){
    res.render('pages/alreadyAdded')
}

function singleDataHandler(req,res){
    let id= req.params.id;
    let SQL= `SELECT * FROM table1 WHERE id=$1;`;
    let safeValues=[id];

    client.query(SQL,safeValues).then(data=>{
        res.render('pages/details',{data:data.rows[0]});
    })
}


function updateHandler(req,res){
    const id= req.params.id;
    const {country,confirmed,recovered,deaths,date}=req.body;
    const safeValues= [country,confirmed,recovered,deaths,date,id];

    const SQL=`UPDATE table1 SET country=$1,confirmed=$2,recovered=$3,deaths=$4,date=$5 WHERE id=$6;`;

    client.query(SQL,safeValues).then(()=>{
        res.redirect(`/details/${id}`);
    });

}

function deleteHandler(req,res){
    const id= req.params.id;
    const SQL=`DELETE FROM table1 WHERE id=$1;`;
    const safeValues=[id];

    client.query(SQL,safeValues).then(()=>{
    
        res.redirect('/saveData')
        
    });
}

////////////////////////
////// Constructors ///
//////////////////////

function Country(data){
    this.country=data.Country;
    this.cases=data.Cases;
    this.date= data.Date;
}


function Countries(data){

    this.country=data.Country;
    this.confirmed=data.TotalConfirmed;
    this.recovered=data.TotalRecovered;
    this.deaths=data.TotalDeaths;
    this.date=data.Date;

}




////////////////////////
////// Listening    ///
//////////////////////

client.connect().then(()=>{
    app.listen(PORT, ()=>{
        console.log(`listening on: ${PORT}`)
    });
})