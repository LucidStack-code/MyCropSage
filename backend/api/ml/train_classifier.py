from api.ml.classifier import CropClassifier

texts = [
    
    "white spots on leaves",
    "plants are wilting",
    "insects eating leaves",
    "pale viens and yellow leaves",
]

labels = [

    "Fungal Infection",
    "Root Rot",
    "Pest Attack",
    "Iron Deficiency",
]

clf = CropClassifier()
clf.train(texts, labels)
print("✅ Model trained and saved successfully!")
