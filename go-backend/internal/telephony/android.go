package telephony

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type Gateway struct {
	db *mongo.Database
}

func NewGateway(db *mongo.Database) *Gateway {
	return &Gateway{db: db}
}

func (g *Gateway) InitiateAndroidCall(userID primitive.ObjectID, label string, callFunc func(phone, name, msg string) error) {
	// 1. Find health profile
	var profile struct {
		Name     string `bson:"name"`
		Contacts []struct {
			Name  string `bson:"name"`
			Phone string `bson:"phone"`
		} `bson:"contacts"`
	}

	coll := g.db.Collection("health_profiles")
	err := coll.FindOne(context.Background(), primitive.M{"user_id": userID}).Decode(&profile)
	if err != nil {
		log.Printf("[Telephony] No medical profile found for User %s: %v\n", userID.Hex(), err)
		return
	}

	patientName := profile.Name
	if patientName == "" {
		patientName = "Người thân của bạn"
	}

	if len(profile.Contacts) == 0 {
		log.Printf("[Telephony] User %s has no emergency contacts.\n", userID.Hex())
		return
	}

	// 2. Translate label to Vietnamese
	incidentVN := label
	switch label {
	case "fall":
		incidentVN = "vừa bị ngã"
	case "unconscious":
		incidentVN = "đang bất tỉnh"
	case "seizure":
		incidentVN = "đang bị co giật"
	}

	// 3. Trigger calls
	for _, contact := range profile.Contacts {
		if contact.Phone != "" {
			log.Printf("[Telephony] Preparing call for %s (%s)...\n", contact.Name, contact.Phone)
			if err := callFunc(contact.Phone, patientName, incidentVN); err != nil {
				log.Printf("[Telephony] Error calling %s: %v\n", contact.Phone, err)
			}
		}
	}
}
