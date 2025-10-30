from rest_framework import viewsets, status
from .models import Problem, Store
from .serializers import ProblemSerializer, StoreSerializer
from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
import math
from .ml.classifier import predict_issue  
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication


# 🌾 CRUD ViewSets
class ProblemViewSet(viewsets.ModelViewSet):
    queryset = Problem.objects.all()
    serializer_class = ProblemSerializer


class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all()
    serializer_class = StoreSerializer


# 🏠 Default Home
def home(request):
    return HttpResponse("<h1>Welcome to MyCropSage!</h1><p>Go to /api/ for API endpoints.</p>")


# 🚫 (Removed old dummy classify_query)
# The old rule-based version caused incorrect outputs (like “yellow → Nitrogen Deficiency”).
# All classification logic is now handled by the multilingual BERT model in predict_issue().


# 🧠 AI-based Crop Problem Classifier
@api_view(["POST"])
def classify(request):
    """
    Classify crop problems using multilingual BERT + custom model.
    """
    query = request.data.get("query", "")
    if not query:
        return Response({"error": "No input provided"}, status=400)

    result = predict_issue(query)
    return Response(result)


# 🧭 Nearby Agro Stores
@api_view(["GET"])
def nearby_stores(request):
    """
    Fetch nearby stores based on user latitude/longitude.
    """
    lat = float(request.GET.get("lat", 0))
    lng = float(request.GET.get("lng", 0))
    radius = float(request.GET.get("radius", 5))

    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(dlon / 2) ** 2
        )
        return 2 * R * math.asin(math.sqrt(a))

    stores = Store.objects.all()
    nearby = []
    for store in stores:
        if store.lat and store.lng:
            distance = haversine(lat, lng, store.lat, store.lng)
            if distance <= radius:
                nearby.append(StoreSerializer(store).data)

    return Response({"stores": nearby})


# 🏬 Add new agro store
@api_view(["POST"])
def add_store(request):
    """API to add a new agro store dynamically"""
    serializer = StoreSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 🔐 Admin Login (Token Auth)
@api_view(["POST"])
def admin_login(request):
    """
    Admin Login API (returns authentication token)
    """
    username = request.data.get("username")
    password = request.data.get("password")

    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key})
        else:
            return Response({"error": "Invalid password"}, status=400)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)
