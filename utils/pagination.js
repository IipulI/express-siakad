export const getPagination = (page, size) => {
    const limit = (size && !isNaN(Number(size))) ? Number(size) : 10;

    const pageNumber = (page && !isNaN(Number(page)) && Number(page) > 0) ? Number(page) : 1;
    const offset = (pageNumber - 1) * limit;

    return { limit, offset };
};

export const getPagingData = (data, page, limit) => {
    const { count: totalItems, rows: items } = data;

    // We return the original page number requested by the user
    const currentPage = (page && !isNaN(Number(page)) && Number(page) > 0) ? Number(page) : 1;
    const totalPages = Math.ceil(totalItems / limit);

    return {
        total: totalItems,
        items: items,
        perPage: limit,
        currentPage: currentPage,
        totalPage: totalPages > 0 ? totalPages : 1,
    };
};