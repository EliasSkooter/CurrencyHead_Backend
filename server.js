const http = require("http");
const app = require("./app");
const server = http.createServer(app);
const port = 9090;


app.listen(port, (res) => {
    console.log(`Started at port ${port}`);
});