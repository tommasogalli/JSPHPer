<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

//error_reporting(0);
error_reporting(E_ALL);
require_once('config.php'); // Store your API key in this file

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    $prompt = $data['prompt'];
    $conversation_history = $data['conversation_history'];
    $conversationWeight = $data['conversationWeight'];
    $additionalContextWeight = $data['additionalContextWeight'];

    $response = call_openai_api($prompt, $conversation_history, $conversationWeight, $additionalContextWeight);

    echo json_encode($response);
}

function format_prompt_for_davinci($messages) {
    $prompt = "";
    foreach ($messages as $message) {
        $role = $message['role'];
        $content = $message['content'];
        $prompt .= ucfirst($role) . ": " . $content . "\n";
    }
    return $prompt;
}

function call_openai_api($prompt, $conversation_history, $conversationWeight, $additionalContextWeight) {
    global $api_key;

  $url = 'https://api.openai.com/v1/chat/completions'; // only for 3.5
  //$url = 'https://api.openai.com/v1/completions'; // only for da vinci
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $api_key
    ];

    // Ensure conversation history is an array of message arrays
    $messages = [];
    foreach ($conversation_history as $message) {
        if (is_array($message)) {
            $messages[] = $message;
        } else {
            $messages[] = ['role' => 'system', 'content' => $message];
        }
    }

    $messages[] = [
      'role' => 'user',
      'content' => $prompt . " Use " . ($conversationWeight * 100) . "% past chat context, " . ($additionalContextWeight * 100) . "% additional context, and " . (100 - ($conversationWeight + $additionalContextWeight) * 100) . "% model knowledge."
    ];

    $body = json_encode([
        'model' => 'gpt-3.5-turbo', // gpt-3.5-turbo
        'messages' => $messages, // gpt-3.5-turbo
        //'model' => 'text-davinci-003', // da vinci
        //'prompt' => format_prompt_for_davinci($messages), // da vinci
        'max_tokens' => 500,
        'n' => 1,
        //'stop' => ["\n"],
        'temperature' => 0.3, // 0-1 the highest this number the more chatty and prone to hallucinations will be
    ]);

    $options = [
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $body
        ]
    ];

    $context = stream_context_create($options);
    $result = @file_get_contents($url, false, $context);

    if (!$result) {
        $error_message = error_get_last()['message'];
        return ['error' => 'Error calling OpenAI API: ' . $error_message];
    }

    $response = json_decode($result, true); // 3.5turbo
    $response_text = $response['choices'][0]['message']['content']; //3.5turbo
    return ['response' => $response_text]; // 3.5turbo

    //$response = json_decode($result, true); //davinci
    //$response_text = $response['choices'][0]['text']; //davinci
    //return ['response' => $response_text]; //davinci
}
?>
