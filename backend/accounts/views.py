from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.permissions import IsPortfolioAdmin
from core.throttles import LoginRateThrottle

from .serializers import LoginSerializer, LogoutSerializer, UserSerializer


class LoginView(TokenObtainPairView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]


class RefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [LoginRateThrottle]


class LogoutView(GenericAPIView):
    """Blacklists the supplied refresh token."""

    serializer_class = LogoutSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    @extend_schema(responses={204: None})
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            RefreshToken(serializer.validated_data["refresh"]).blacklist()
        except TokenError:
            return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(GenericAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsPortfolioAdmin]

    def get(self, request):
        return Response(self.get_serializer(request.user).data)
