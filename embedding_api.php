<?php

require_once 'config.php';
ini_set('memory_limit', '1024M'); // Set the memory limit to 1024MB

// Load the API key from your config.php file
$api_key = $api_key;

header('Content-Type: application/json');

try {
    $raw_input = file_get_contents('php://input');
    $input = json_decode($raw_input, true);

    if (!isset($input['texts']) || !is_array($input['texts']) || empty($input['texts'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid input data.']);
        exit();
    }

    // Prepare the data for the Embedding API request
    $data = [
        'input' => $input['texts'],
        'model' => 'text-embedding-ada-002'
    ];

    // Initialize cURL and set options
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/embeddings');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key
    ]);

    // Execute the cURL request and get the response
    $response = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    if ($http_code != 200) {
        http_response_code($http_code);
        echo $response;
        exit();
    }

    // Close the cURL session
    curl_close($ch);

    // Decode the response JSON
    $response_data = json_decode($response, true);

    // Extract the embeddings and return them as JSON
    $embeddings = array_map(function ($item) {
        return $item['embedding'];
    }, $response_data['data']);

    echo json_encode(['embeddings' => $embeddings]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'An internal server error occurred: ' . $e->getMessage()]);
}
?>
