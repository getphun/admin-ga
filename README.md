# admin-ga

Site pageview/realtime statistik menggunakan google analytics. Modul ini membutuhkan
tambahan pada site setting dengan nama `google_analytics_view` yang berisi view id
google analytics yang digunakan.

## Mendapatkan Nilai Googla Analytics View

Google analytics view id bisa diambil dari URL halaman google analytics Anda.
Silahkan buka realtime menu pada google analytics, kemudian ambil semua nomor di URL
setelah karakter `p`.

```
https://analytics.google.com/analytics/web/#realtime/rt-overview/a55684976w108189277p112732752/
                                                                                     ---------
```

Jika alamat google analytics Anda adalah seperti contoh di atas, maka isi nilai 
`google_analytics_view` dengan `112732752`.