import * as hasilStudiService from "../../services/hasil-studi.service.js";
import ResponseBuilder from "../../utils/response.js";
import { getPagingData } from "../../utils/pagination.js";
import { validationResult } from "express-validator";

const formatHasilStudiResponse = (rawData) => {
  let totalSks = 0;
  let totalBobot = 0;

  const formattedMataKuliah = rawData.rincianKrs.map((rincian, index) => {
    const mk = rincian.kelasKuliah?.mataKuliah || {};

    const sks = mk.totalSks || 0;
    const nilaiMutu = parseFloat(rincian.angkaMutu) || 0;
    const bobot = sks * nilaiMutu;

    totalSks += sks;
    totalBobot += bobot;

    return {
      no: index + 1,
      kode: mk.kode || '-',
      namaMataKuliah: mk.nama || '-',
      sks: sks,
      nilaiMutu: nilaiMutu.toFixed(2),
      bobot: bobot,
      nilai: rincian.hurufMutu || '-'
    };
  });

  const ipsCalculated = totalSks > 0 ? (totalBobot / totalSks).toFixed(2) : "0.00";
  const ipsFinal = rawData.hasilStudi?.ips ? parseFloat(rawData.hasilStudi.ips).toFixed(2) : ipsCalculated;

  return {
    totalSks: totalSks,
    totalBobot: totalBobot,
    ips: ipsFinal,
    totalMataKuliah: formattedMataKuliah.length,
    mataKuliah: formattedMataKuliah
  };
};

export const getHasilStudi = async (req, res) => {
  const responseBuilder = new ResponseBuilder(res);

  const user = req.user;
  const mahasiswa = user.mahasiswa;

  try {
    const mahasiswaId = mahasiswa.id;
    const periodeId = req.query.periodeId;

    const rawData = await hasilStudiService.getHasilStudi(
      mahasiswaId,
      periodeId
    );

    const responseData = formatHasilStudiResponse(rawData);

    responseBuilder
      .status("success")
      .code(200)
      .message("Berhasil mengambil data")
      .json(responseData);
  } catch (error) {
    responseBuilder
      .status("failure")
      .code(500)
      .message("Gagal mengambil data")
      .json(error.message);
  }
};

export const getHasilStudiByNpm = async (req, res) => {
  const responseBuilder = new ResponseBuilder(res);
  const { npm } = req.params;
  const { periodeId } = req.query;

  try {
    const { default: db } = await import("../../models/index.js");
    const Mahasiswa = db.Mahasiswa;

    const mahasiswa = await Mahasiswa.findOne({ where: { npm } });
    if (!mahasiswa) {
      return responseBuilder
        .status("failure")
        .code(404)
        .message("Mahasiswa tidak ditemukan")
        .send();
    }

    const rawData = await hasilStudiService.getHasilStudi(
      mahasiswa.id,
      periodeId
    );

    const responseData = formatHasilStudiResponse(rawData);

    responseBuilder
      .status("success")
      .code(200)
      .message("Berhasil mengambil data")
      .json(responseData);
  } catch (error) {
    responseBuilder
      .status("failure")
      .code(500)
      .message("Gagal mengambil data")
      .json(error.message);
  }
};
