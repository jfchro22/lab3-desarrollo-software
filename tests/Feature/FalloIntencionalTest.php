<?php

namespace Tests\Feature;

use Tests\TestCase;

class FalloIntencionalTest extends TestCase
{
    public function test_fallo_intencional_para_evidencia_de_ci(): void
    {
        $this->assertTrue(false);
    }
}
