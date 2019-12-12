const {
  Guru,
  kelompok_matpel_guru,
  Tahun,
  Kelas,
  MataPelajaran,
  kelompok_kelas,
  Siswa,
  NilaiPengetahuan,
  NilaiKeterampilan
} = require("../models");
const Op = require("sequelize").Op;


exports.viewHome = async (req, res) => {
  const userLogin = req.session.user
  try {
    res.render("wali_kelas/home/view_home", {
      title: "E-Raport | Guru",
      user: userLogin
    })
  } catch (err) {
    throw err
  }
}

exports.viewMatpelDiampuh = async (req, res) => {
  const userLogin = req.session.user
  Guru.findOne({
    where: { UserId: { [Op.eq]: userLogin.id } }
  }).then((guru) => {
    kelompok_matpel_guru.findAll({
      where: { GuruId: { [Op.eq]: guru.id } },
      include: [
        { model: Tahun },
        { model: Kelas },
        { model: MataPelajaran },
        {
          model: Tahun,
          where: {
            status: { [Op.eq]: "Active" }
          }
        },
      ]
    }).then((diampuh) => {

      res.render("wali_kelas/matpel_diampuh/view_matpel_diampuh", {
        title: "E-Raport | Matpel Diampuh",
        user: userLogin,
        diampuh
      })
    })
  })
}

exports.viewMatpelPengetahuan = async (req, res) => {
  const { KelasId } = req.params
  const userLogin = req.session.user

  const kelas = await Kelas.findOne({
    where: {
      id: { [Op.eq]: KelasId }
    },
  })
  kelompok_kelas.findAll({
    where: {
      KelasId: { [Op.eq]: KelasId }
    },
    include: [
      { model: Kelas },
      {
        model: Tahun,
        where: {
          status: { [Op.eq]: "Active" }
        }
      },
      { model: Siswa },
    ]
  }).then((kelompok_siswa) => {
    res.render("wali_kelas/matpel_diampuh/view_input_nilai_pengetahuan", {
      title: "E-Raport | Wali Kelas",
      user: userLogin,
      kelompok_siswa,
      kelas: kelas.nama
    })
  })
}

exports.viewDetailNilai = async (req, res) => {
  const { SiswaId } = req.params
  const userLogin = req.session.user

  const siswa = await Siswa.findOne({
    where: {
      id: { [Op.eq]: SiswaId }
    },
  })

  const kelas_siswa = await kelompok_kelas.findOne({
    SiswaId: { [Op.eq]: SiswaId }
  })

  const kelas_guru = await kelompok_matpel_guru.findOne({
    KelasId: { [Op.eq]: kelas_siswa.KelasId }
  })

  NilaiPengetahuan.findOne({
    where: {
      SiswaId: { [Op.eq]: SiswaId }
    },
    include: [
      {
        model: Tahun,
        where: {
          status: { [Op.eq]: "Active" }
        }
      },
      { model: Siswa },
      { model: Guru },
      { model: MataPelajaran },
    ]
  }).then((nilai) => {

    res.render("wali_kelas/matpel_diampuh/view_detail_input_nilai_pengetahuan", {
      title: "E-Raport | Guru",
      user: userLogin,
      nilai: nilai === null ? 0 : nilai,
      siswa,
      kelas_guru
    })

  })
}

exports.actionCreateNilai = (req, res) => {
  const { latihan, uts, uas, SiswaId, GuruId, TahunId, MatpelId } = req.body
  let n_latihan = 60 / 100 * latihan;
  let n_uts = 20 / 100 * uts;
  let n_uas = 20 / 100 * uas;
  const n_nilai = n_latihan + n_uts + n_uas;
  let alphabet;
  let keterangan;
  // console.log(n_latihan)
  // console.log(n_nilai)
  // pikir kan logic nilai berdasarkan kkm
  if (n_nilai >= 88 && n_nilai <= 100) {
    alphabet = "A";
    keterangan = "Sangat Baik Memahami Materi";
  } else if (n_nilai >= 74 && n_nilai < 88) {
    alphabet = "B";
    keterangan = "Baik Memahami Materi";
  } else if (n_nilai >= 60 && n_nilai < 74) {
    alphabet = "C";
    keterangan = "Cukup Baik Memahami Materi";
  } else if (n_nilai < 60) {
    alphabet = "D";
    keterangan = "Kurang Baik Memahami Materi";
  }

  NilaiPengetahuan.create({
    latihan: latihan,
    uts: uts,
    uas: uas,
    SiswaId: SiswaId,
    GuruId: GuruId,
    TahunId: TahunId,
    MatpelId: MatpelId,
    ket: keterangan,
    nilai_akhir: n_nilai,
    nilai: alphabet,
    status: "Nonactive"
  }).then(() => {
    res.redirect(`/wali-kelas/matpel-diampuh/input-nilai/${SiswaId}`)
  })
}

exports.actionDeteleNilai = (req, res) => {
  const { id, SiswaId } = req.params
  NilaiPengetahuan.findOne({
    where: { id: { [Op.eq]: id } }
  }).then((nilai) => {
    nilai.destroy();
    res.redirect(`/wali-kelas/matpel-diampuh/input-nilai/${SiswaId}`)
  })
}


const include = {
  include: [
    { model: Tahun },
    { model: Kelas },
    { model: MataPelajaran }
  ]
}
exports.viewRiwayatMengajar = async (req, res) => {

  const userLogin = req.session.user
  Guru.findOne({
    where: { UserId: { [Op.eq]: userLogin.id } }
  }).then((guru) => {
    kelompok_matpel_guru.findAll({
      where: { GuruId: { [Op.eq]: guru.id } },
      ...include
    }).then((riwayat) => {
      res.render("wali_kelas/riwayat_mengajar/view_riwayat_mengajar", {
        title: "E-Raport | Matpel Diampuh",
        user: userLogin,
        riwayat
      })
    })
  })
}

exports.viewAbsen = async (req, res) => {
  try {
    res.render("wali_kelas/absen/view_absen", {
      title: "E-Raport | Absen",
    })
  } catch (err) {
    throw err
  }
}

exports.viewRaport = async (req, res) => {
  try {
    res.render("wali_kelas/raport/view_raport", {
      title: "E-Raport | Absen",
    })
  } catch (err) {
    throw err
  }
}

exports.viewNilaiSikap = async (req, res) => {
  try {
    res.render("wali_kelas/input_nilai_sikap/view_input_nilai_sikap", {
      title: "E-Raport | Input Nilai Sikap",
    })
  } catch (err) {
    throw err
  }
}

exports.viewNilaiEktra = async (req, res) => {
  try {
    res.render("wali_kelas/input_nilai_ektrakulikuler/view_input_nilai_ektrakulikuler", {
      title: "E-Raport | Input Nilai Ektrakulikuler",
    })
  } catch (err) {
    throw err
  }
}

exports.viewValidasiNilai = async (req, res) => {
  try {
    res.render("wali_kelas/validasi_nilai/view_validasi_nilai", {
      title: "E-Raport | Input Nilai Ektrakulikuler",
    })
  } catch (err) {
    throw err
  }
}