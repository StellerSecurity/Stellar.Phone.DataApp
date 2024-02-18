

// Get a value from the Capacitor KV store
addEventListener('testLoad', async (resolve, reject, args) => {


    console.log("lol");
    const res = await fetch('https://randomuser.me/api/');
    console.log(res.ok);




    var obj = new Object();
    obj.name = "Raj";
    obj.age = 32;
    obj.married = false;

    console.log("fuck me");

//convert object to json string
    var string = JSON.stringify(obj);

    resolve(JSON.parse(string));

});
