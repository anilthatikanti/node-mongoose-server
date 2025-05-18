class Message {
    constructor(action, variables, type = null) {
        this.action = action;
        this.variables = variables;
        this.type = type;
    }

    static fromJSON(json) {
        // Handle 'stocks', 'variable', and 'variables' fields for better compatibility
        const variables = json.variables || json.variable || json.stocks || [];
        return new Message(json.action, variables, json.type);
    }
}

class Response {
    constructor(action, symbols, type = null, error = null) {
        this.action = action;
        this.symbols = symbols;
        this.type = type;
        if (error) this.error = error;
    }
}

class TickerResponse {
    constructor(symbol, type, data) {
        this.action = 'update';
        this.symbol = symbol;
        this.type = type;
        this.data = data;
    }
}

module.exports = {
    Message,
    Response,
    TickerResponse
}; 