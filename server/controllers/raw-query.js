"use strict";

module.exports = {
  async execute(ctx) {
    const { code: query, bindings } = ctx.request.body || {};

    if (!query) {
      ctx.status = 400;
      ctx.body = { ok: false, message: "Missing SQL query" };
      return;
    }

    try {
      // chạy raw query (ưu tiên dùng parameterized query với bindings)
      const result = await strapi.db.connection.raw(query, bindings || []);

      ctx.body = {
        ok: true,
        response: {
          query,
          result: result[0], // PG thường có .rows, MySQL thì trả array
        },
      };
    } catch (err) {
      // log chi tiết lỗi vào console/server log

      // trả lỗi gọn gàng về client
      ctx.body = {
        ok: false,
        response: {
          query,
          error: err.message,
        },
      };
    }
  },
};
