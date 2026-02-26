import subprocess
import sys
from django.core.management.commands.runserver import Command as RunserverCommand

class Command(RunserverCommand):
    help = "Build React app before starting Django runserver."

    def handle(self, *args, **options):
        # Build React app
        print("Building React app...")
        import os
        # Compute absolute path to MARIO directory
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(backend_dir, '../../../..'))
        mario_dir = os.path.join(project_root, 'MARIO')
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd=mario_dir,
            stdout=sys.stdout,
            stderr=sys.stderr,
        )
        if result.returncode != 0:
            print("React build failed. Aborting runserver.")
            sys.exit(result.returncode)
        print("React build complete. Starting Django server...")
        super().handle(*args, **options)