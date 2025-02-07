echo "spinning up docker images for required services"
docker compose up -d

echo "\n\n";

echo "pulling required models (0/2)\n"
echo "pulling embed models (1/2)\n"
curl http://localhost:11434/api/pull -d '{"model":"nomic-embed-text:latest"}'

echo "pulling chat models (2/2)\n"
curl http://localhost:11434/api/pull -d '{"model":"artifish/llama3.2-uncensored:latest"}'

echo "\n\n";

echo "installing electron dependencies \n"
npm install

echo "\n\n";

echo "starting app \n"
npm start