<?php

namespace App\Exceptions;

use Exception;

class BusinessRuleException extends Exception
{
    /**
     * Codigo interno de la regla violada (util en Lab 5 para mapear a codigos HTTP).
     */
    protected string $ruleCode;

    public function __construct(string $message, string $ruleCode = 'business_rule_violation')
    {
        parent::__construct($message);
        $this->ruleCode = $ruleCode;
    }

    public function getRuleCode(): string
    {
        return $this->ruleCode;
    }
}