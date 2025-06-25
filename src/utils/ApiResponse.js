class ApiResponse {
    constructor(statusCode, data, message = "Success"){
        this.statusCode= statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}

export { ApiResponse }

// statuscode-->
// 1.information response (100 - 199)
// 2.successful response (200 - 299)
// 3.redirection messages (300 - 399)
// 4.client error response (400 - 499)
// 5.server error response (500 - 599)