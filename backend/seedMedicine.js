const mongoose = require("mongoose");
require("dotenv").config();

const Medicine = require("./models/Medicine");

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  console.log("MongoDB Connected");

  await Medicine.deleteMany({});

  await Medicine.insertMany([
    { name:"Paracetamol 500mg", brand:"GSK", category:"Pain Relief", price:5.99, oldPrice:7.99, stock:120, image:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae", requiresPrescription:false },
    { name:"Ibuprofen 400mg", brand:"Advil", category:"Pain Relief", price:7.49, oldPrice:9.99, stock:95, image:"https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2", requiresPrescription:false },
    { name:"Amoxicillin 250mg", brand:"Augmentin", category:"Antibiotic", price:12.99, stock:60, image:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88", requiresPrescription:true },
    { name:"Cetirizine 10mg", brand:"Zyrtec", category:"Allergy", price:6.99, stock:140, image:"https://images.unsplash.com/photo-1626716493137-b67fe9501d2d", requiresPrescription:false },
    { name:"Vitamin C 1000mg", brand:"NatureMade", category:"Vitamins", price:9.99, stock:110, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Metformin 500mg", brand:"Glucophage", category:"Diabetes", price:14.50, stock:80, image:"https://images.unsplash.com/photo-1580281657527-47b0d8d9f6e1", requiresPrescription:true },
    { name:"Aspirin 75mg", brand:"Bayer", category:"Heart Health", price:4.99, stock:130, image:"https://images.unsplash.com/photo-1626285861696-9f0bf5a3e5c5", requiresPrescription:false },
    { name:"Omeprazole 20mg", brand:"Prilosec", category:"Digestion", price:8.75, stock:90, image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde", requiresPrescription:false },
    { name:"Azithromycin 500mg", brand:"Zithromax", category:"Antibiotic", price:16.99, stock:45, image:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", requiresPrescription:true },
    { name:"Losartan 50mg", brand:"Cozaar", category:"Blood Pressure", price:13.49, stock:70, image:"https://images.unsplash.com/photo-1628771065518-0d82f1938462", requiresPrescription:true },

    { name:"Atorvastatin 20mg", brand:"Lipitor", category:"Cholesterol", price:15.25, stock:75, image:"https://images.unsplash.com/photo-1626716493137-b67fe9501d2d", requiresPrescription:true },
    { name:"Insulin Pen", brand:"NovoRapid", category:"Diabetes", price:35.99, stock:40, image:"https://images.unsplash.com/photo-1576602976047-174e57a47881", requiresPrescription:true },
    { name:"Cough Syrup", brand:"Benadryl", category:"Cold & Flu", price:6.50, stock:100, image:"https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2", requiresPrescription:false },
    { name:"Hydrocortisone Cream", brand:"Cortizone", category:"Skin Care", price:7.20, stock:85, image:"https://images.unsplash.com/photo-1597764699510-894ddf0c0d41", requiresPrescription:false },
    { name:"Multivitamin Tablets", brand:"Centrum", category:"Vitamins", price:11.99, stock:150, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Salbutamol Inhaler", brand:"Ventolin", category:"Respiratory", price:18.99, stock:55, image:"https://images.unsplash.com/photo-1585435557343-3b092031a831", requiresPrescription:true },
    { name:"Naproxen 250mg", brand:"Aleve", category:"Pain Relief", price:8.40, stock:78, image:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae", requiresPrescription:false },
    { name:"Loratadine 10mg", brand:"Claritin", category:"Allergy", price:7.95, stock:112, image:"https://images.unsplash.com/photo-1626285861696-9f0bf5a3e5c5", requiresPrescription:false },
    { name:"Eye Drops Refresh", brand:"Refresh Plus", category:"Eye Care", price:5.60, stock:98, image:"https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", requiresPrescription:false },
    { name:"Calcium Tablets", brand:"Caltrate", category:"Bone Health", price:10.49, stock:102, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },

    { name:"Diclofenac Gel", brand:"Voltaren", category:"Pain Relief", price:9.20, stock:80, image:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae", requiresPrescription:false },
    { name:"Ranitidine 150mg", brand:"Zantac", category:"Digestion", price:7.99, stock:67, image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde", requiresPrescription:false },
    { name:"Doxycycline 100mg", brand:"Vibramycin", category:"Antibiotic", price:13.75, stock:52, image:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88", requiresPrescription:true },
    { name:"Folic Acid", brand:"NatureMade", category:"Vitamins", price:6.25, stock:115, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Ferrous Sulfate", brand:"Feosol", category:"Supplements", price:8.90, stock:99, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Levothyroxine 50mcg", brand:"Synthroid", category:"Thyroid", price:19.99, stock:44, image:"https://images.unsplash.com/photo-1580281657527-47b0d8d9f6e1", requiresPrescription:true },
    { name:"Amlodipine 5mg", brand:"Norvasc", category:"Blood Pressure", price:12.45, stock:71, image:"https://images.unsplash.com/photo-1628771065518-0d82f1938462", requiresPrescription:true },
    { name:"Clopidogrel 75mg", brand:"Plavix", category:"Heart Health", price:17.10, stock:59, image:"https://images.unsplash.com/photo-1626285861696-9f0bf5a3e5c5", requiresPrescription:true },
    { name:"Prednisone 10mg", brand:"Deltasone", category:"Steroid", price:14.80, stock:39, image:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88", requiresPrescription:true },
    { name:"Tramadol 50mg", brand:"Ultram", category:"Pain Relief", price:20.99, stock:33, image:"https://images.unsplash.com/photo-1584308666744-24d5c474f2ae", requiresPrescription:true },

    { name:"Zinc Tablets", brand:"Now Foods", category:"Supplements", price:9.50, stock:88, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Magnesium Capsules", brand:"Nature's Bounty", category:"Supplements", price:11.20, stock:76, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Antacid Liquid", brand:"Gaviscon", category:"Digestion", price:8.60, stock:66, image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde", requiresPrescription:false },
    { name:"Nasal Spray", brand:"Otrivin", category:"Cold & Flu", price:6.75, stock:97, image:"https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2", requiresPrescription:false },
    { name:"Mupirocin Ointment", brand:"Bactroban", category:"Skin Care", price:13.99, stock:41, image:"https://images.unsplash.com/photo-1597764699510-894ddf0c0d41", requiresPrescription:true },
    { name:"Ketoconazole Shampoo", brand:"Nizoral", category:"Hair Care", price:14.49, stock:62, image:"https://images.unsplash.com/photo-1597764699510-894ddf0c0d41", requiresPrescription:false },
    { name:"Glucose Test Strips", brand:"AccuChek", category:"Diabetes", price:25.99, stock:58, image:"https://images.unsplash.com/photo-1576602976047-174e57a47881", requiresPrescription:false },
    { name:"Protein Powder", brand:"MuscleTech", category:"Supplements", price:29.99, stock:35, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Omega 3 Capsules", brand:"Nordic Naturals", category:"Supplements", price:18.99, stock:77, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"B12 Tablets", brand:"NatureMade", category:"Vitamins", price:10.40, stock:82, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },

    { name:"Pantoprazole 40mg", brand:"Protonix", category:"Digestion", price:15.60, stock:48, image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde", requiresPrescription:true },
    { name:"Ciprofloxacin 500mg", brand:"Cipro", category:"Antibiotic", price:18.20, stock:43, image:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88", requiresPrescription:true },
    { name:"Fluconazole 150mg", brand:"Diflucan", category:"Antifungal", price:11.99, stock:50, image:"https://images.unsplash.com/photo-1587854692152-cbe660dbde88", requiresPrescription:true },
    { name:"Lisinopril 10mg", brand:"Prinivil", category:"Blood Pressure", price:12.99, stock:69, image:"https://images.unsplash.com/photo-1628771065518-0d82f1938462", requiresPrescription:true },
    { name:"Warfarin 5mg", brand:"Coumadin", category:"Heart Health", price:16.75, stock:36, image:"https://images.unsplash.com/photo-1626285861696-9f0bf5a3e5c5", requiresPrescription:true },
    { name:"Melatonin 5mg", brand:"Natrol", category:"Sleep Aid", price:9.30, stock:101, image:"https://images.unsplash.com/photo-1616671276441-2f2c277b8bf1", requiresPrescription:false },
    { name:"Probiotic Capsules", brand:"Culturelle", category:"Digestion", price:19.40, stock:64, image:"https://images.unsplash.com/photo-1603398938378-e54eab446dde", requiresPrescription:false },
    { name:"Hand Sanitizer", brand:"Dettol", category:"Personal Care", price:4.99, stock:140, image:"https://images.unsplash.com/photo-1585435557343-3b092031a831", requiresPrescription:false },
    { name:"Face Mask Pack", brand:"3M", category:"Personal Care", price:6.99, stock:160, image:"https://images.unsplash.com/photo-1585435557343-3b092031a831", requiresPrescription:false },
    { name:"Thermometer Digital", brand:"Omron", category:"Medical Devices", price:24.99, stock:32, image:"https://images.unsplash.com/photo-1585435557343-3b092031a831", requiresPrescription:false }
  ]);

  console.log("50 Medicines Added Successfully");
  process.exit();
})
.catch(err => console.log(err));