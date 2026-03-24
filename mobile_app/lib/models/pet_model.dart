class PetModel {
  final int    petId;
  final int    ownerId;
  final String petName;
  final String species;
  final String? breed;
  final int?   age;
  final String? dateOfBirth;
  final String gender;
  final double? weight;
  final String? color;
  final String? microchipId;
  final String? allergies;
  final String? specialNotes;
  final String status;
  final String? qrCode;
  final String? ownerName;
  final String? ownerPhone;
  final int?   branchId;
  final String? branchName;

  PetModel({
    required this.petId,
    required this.ownerId,
    required this.petName,
    required this.species,
    this.breed,
    this.age,
    this.dateOfBirth,
    required this.gender,
    this.weight,
    this.color,
    this.microchipId,
    this.allergies,
    this.specialNotes,
    required this.status,
    this.qrCode,
    this.ownerName,
    this.ownerPhone,
    this.branchId,
    this.branchName,
  });

  factory PetModel.fromJson(Map<String, dynamic> json) {
    return PetModel(
      petId:        json['pet_id']       ?? 0,
      ownerId:      json['owner_id']     ?? 0,
      petName:      json['pet_name']     ?? '',
      species:      json['species']      ?? '',
      breed:        json['breed'],
      age:          json['age'],
      dateOfBirth:  json['date_of_birth'],
      gender:       json['gender']       ?? 'Unknown',
      weight:       json['weight'] != null
          ? double.tryParse(json['weight'].toString()) : null,
      color:        json['color'],
      microchipId:  json['microchip_id'],
      allergies:    json['allergies'],
      specialNotes: json['special_notes'],
      status:       json['status']       ?? 'Active',
      qrCode:       json['qr_code'],
      ownerName:    json['owner_name'],
      ownerPhone:   json['owner_phone'],
      branchId:     json['branch_id'],
      branchName:   json['branch_name'],
    );
  }

  String get speciesIcon {
    switch (species.toLowerCase()) {
      case 'dog':    return '🐕';
      case 'cat':    return '🐈';
      case 'bird':   return '🦜';
      case 'rabbit': return '🐇';
      case 'fish':   return '🐟';
      default:       return '🐾';
    }
  }
}