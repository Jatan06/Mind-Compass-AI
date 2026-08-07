import socket
import sys
from django.apps import AppConfig


class CoreConfig(AppConfig):
    name = 'core'

    def ready(self):
        """
        Patch Django's WSGI development server to silently ignore harmless TCP Keep-Alive
        socket timeouts and disconnects instead of printing noisy stack traces to the terminal console.
        """
        try:
            from django.core.servers.basehttp import WSGIServer, WSGIRequestHandler

            # 1. Suppress server-level handle_error for socket timeouts and drops
            orig_handle_error = WSGIServer.handle_error

            def quiet_handle_error(self, request, client_address):
                exc_type = sys.exc_info()[0]
                if exc_type and issubclass(exc_type, (socket.timeout, TimeoutError, ConnectionResetError, BrokenPipeError)):
                    return  # Silently ignore harmless connection timeouts & drops
                return orig_handle_error(self, request, client_address)

            WSGIServer.handle_error = quiet_handle_error

            # 2. Suppress request-level socket timeouts gracefully
            orig_handle_one_request = WSGIRequestHandler.handle_one_request

            def quiet_handle_one_request(self):
                try:
                    return orig_handle_one_request(self)
                except (socket.timeout, TimeoutError, ConnectionResetError, BrokenPipeError):
                    self.close_connection = True

            WSGIRequestHandler.handle_one_request = quiet_handle_one_request

        except Exception:
            pass
