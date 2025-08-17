import * as agamaService from "../../services/agama.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";

export const findAll = async (req, res) => {
  const page = req.query.page ? parseInt(req.query.page) : null;
  const size = req.query.size ? parseInt(req.query.size) : null;
  const responseBuilder = new ResponseBuilder(res);

  try {
    const data = await agamaService.findAll(page, size);

    let payload;
    if (data.isPaginated === true) {
      payload = getPagingData(data, page, size);
    } else {
      payload = data.rows;
    }

    responseBuilder.code(200).message("Berhasil Menggambil data").json(payload);
  } catch (error) {
    responseBuilder
      .status("failure")
      .code(500)
      .message(error.message || "Kesalahan yang tidak terduga.")
      .json();
  }
};

export const create = async (req, res) => {
    const responseBuilder = new ResponseBuilder(res);

    try {
        await agamaService.createAgama(req.body)

        responseBuilder
            .code(201)
            .message("Data agama berhasil ditambahkan")
            .json();
    }
    catch (err) {
        if (err.message.includes('already exists')) {
            return responseBuilder
                .status('failure')
                .code(409)
                .message(err.message)
                .json();
        }

        responseBuilder
            .status('failure')
            .code(500)
            .message(err.message || 'Terjadi kesalahan saat menambahkan data Agama.')
            .json();
    }
}

export const update = async (req, res) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);
    const { nama } = req.body;

    // request validation
    if (!nama) {
        return responseBuilder
            .status('failure')
            .code(404)
            .message("Harap isi minimal satu data (nama) untuk update")
            .json();
    }

    try {
        const isUpdated = await agamaService.updateAgama(id, req.body)

        if (isUpdated) {
            return responseBuilder.status('success')
                .code(200)
                .message("Data berhasil diperbarui")
                .json();
        } else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Data Agama dengan ID ${id} tidak ditemukan atau tidak ada perubahan yang dilakukan`)
                .json();
        }
    }
    catch (error) {
        responseBuilder
            .status('failure')
            .code(500)
            .message("Terjadi kesalahan yang tidak terduga")
            .json();
    }
}

export const destroy = async (req, res) => {
    const { id } = req.params;
    const responseBuilder = new ResponseBuilder(res);

    try {
        const isDeleted = await agamaService.deleteAgama(id);

        if (isDeleted) {
            return res.status(204).end();
        }
        else {
            return responseBuilder
                .status('failure')
                .code(404)
                .message(`Data Agama dengan ID ${id} tidak ditemukan`)
                .json();
        }
    } catch (error) {
        console.error(error);
        return responseBuilder
            .status('failure')
            .code(500)
            .message('Terjadi kesalahan yang tidak terduga')
            .json();
    }
}