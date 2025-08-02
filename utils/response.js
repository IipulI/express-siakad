class ResponseBuilder {
    /**
     * @param {object} res - The Express response object.
     */
    constructor(res) {
        this.res = res;
        this._status = 'success';
        this._code = null;
        this._message = null;
        this._data = null;
    }

    /**
     * Sets the response type.
     * @param {'success' | 'failure'} status - The type of response.
     * @returns {this} Allows for method chaining.
     */
    status(status) {
        this._status = status;
        return this;
    }

    /**
     * Sets the HTTP status code for the response.
     * @param {number} code - The HTTP status code (e.g., 200, 404, 500).
     * @returns {this} Allows for method chaining.
     */
    code(code) {
        this._code = code;
        return this;
    }

    /**
     * Sets a custom message for the response.
     * @param {string} message - The custom message.
     * @returns {this} Allows for method chaining.
     */
    message(message) {
        this._message = message;
        return this;
    }

    /**
     * Builds and sends the final JSON response.
     * @param {object | Array | null} payload - The data for a success response or errors for a failure response.
     */
    json(payload = null) {
        let finalCode = this._code;
        if (!finalCode) {
            finalCode = this._status === 'success' ? 200 : 422;
        }

        const responseBody = {
            status: finalCode,
            message: this._message || this._status,
        };

        if (this._status === 'success') {
            this._buildSuccessBody(responseBody, payload);
        } else {
            this._buildFailureBody(responseBody, payload);
        }

        this.res.status(finalCode).json(responseBody);
    }

    /**
     * Internal method to construct the body for a success response.
     * @param {object} responseBody - The base response object to modify.
     * @param {object | Array | null} data - The data payload.
     */
    _buildSuccessBody(responseBody, data) {
        if (data && typeof data.total === 'number' && Array.isArray(data.items)) {
            responseBody.data = data.items;
            responseBody.pagination = {
                currentPage: data.currentPage,
                perPage: data.perPage,
                totalPage: data.totalPage,
                totalItems: data.total
            };
        } else {
            responseBody.data = data || {};
        }
        responseBody.errors = {};
    }

    /**
     * Internal method to construct the body for a failure response.
     * @param {object} responseBody - The base response object to modify.
     * @param {object | string | null} errors - The error payload.
     */
    _buildFailureBody(responseBody, errors) {
        responseBody.data = {};
        if (typeof errors === 'string') {
            responseBody.errors = { errors };
        } else {
            responseBody.errors = errors || {};
        }
    }
}

export default ResponseBuilder;